import type { ActualizarEvento, DatosEvento } from "@compartido/contratos";
import type {
  Administrador,
  AlmacenAcceso,
  EventoGuardado,
  Rol,
  SesionGuardada,
} from "./almacen-acceso";

interface FilaEvento {
  tipo: EventoGuardado["tipo"];
  nombre: string;
  logo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  salas_simultaneas: number;
  horas_por_dia: number;
  dias: number;
  nube_como_respaldo: number;
}

interface FilaAdministrador {
  email: string;
  contrasena_hash: string;
  codigo_recuperacion_hash: string;
}

// Una restricción única (CHECK id = 1, PRIMARY KEY) rota es "ya había uno", no un error.
function esRestriccion(error: unknown): boolean {
  return error instanceof Error && /constraint/i.test(error.message);
}

async function insertarUnico(sentencia: D1PreparedStatement): Promise<boolean> {
  try {
    await sentencia.run();
    return true;
  } catch (error) {
    if (esRestriccion(error)) return false;
    throw error;
  }
}

export function crearAlmacenD1(db: D1Database): AlmacenAcceso {
  return {
    async leerAdministrador() {
      const fila = await db
        .prepare(
          "SELECT email, contrasena_hash, codigo_recuperacion_hash FROM administrador WHERE id = 1",
        )
        .first<FilaAdministrador>();
      if (!fila) return null;
      const administrador: Administrador = {
        email: fila.email,
        contrasenaHash: fila.contrasena_hash,
        codigoRecuperacionHash: fila.codigo_recuperacion_hash,
      };
      return administrador;
    },

    crearAdministrador: (administrador, ahora) =>
      insertarUnico(
        db
          .prepare(
            "INSERT INTO administrador (id, email, contrasena_hash, codigo_recuperacion_hash, creado_en) VALUES (1, ?, ?, ?, ?)",
          )
          .bind(
            administrador.email,
            administrador.contrasenaHash,
            administrador.codigoRecuperacionHash,
            ahora,
          ),
      ),

    async cambiarCredenciales({ contrasenaHash, codigoRecuperacionHash }) {
      await db
        .prepare(
          "UPDATE administrador SET contrasena_hash = ?, codigo_recuperacion_hash = ? WHERE id = 1",
        )
        .bind(contrasenaHash, codigoRecuperacionHash)
        .run();
    },

    async leerEvento() {
      const fila = await db
        .prepare(
          "SELECT tipo, nombre, logo, fecha_inicio, fecha_fin, salas_simultaneas, horas_por_dia, dias, nube_como_respaldo FROM evento WHERE id = 1",
        )
        .first<FilaEvento>();
      if (!fila) return null;
      const evento: EventoGuardado = {
        tipo: fila.tipo,
        nombre: fila.nombre,
        logo: fila.logo,
        fechaInicio: fila.fecha_inicio,
        fechaFin: fila.fecha_fin,
        salasSimultaneas: fila.salas_simultaneas,
        horasPorDia: fila.horas_por_dia,
        dias: fila.dias,
        nubeComoRespaldo: fila.nube_como_respaldo === 1,
      };
      return evento;
    },

    crearEvento: (evento: DatosEvento, ahora) =>
      insertarUnico(
        db
          .prepare(
            "INSERT INTO evento (id, nombre, tipo, logo, fecha_inicio, fecha_fin, salas_simultaneas, horas_por_dia, dias, nube_como_respaldo, creado_en) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .bind(
            evento.nombre,
            evento.tipo,
            evento.logo ?? null,
            evento.fechaInicio ?? null,
            evento.fechaFin ?? null,
            evento.salasSimultaneas,
            evento.horasPorDia,
            evento.dias,
            evento.nubeComoRespaldo ? 1 : 0,
            ahora,
          ),
      ),

    async actualizarEvento(cambios: ActualizarEvento & { nubeComoRespaldo?: boolean }) {
      const resultado = await db
        .prepare(
          "UPDATE evento SET nombre = ?, logo = ?, fecha_inicio = ?, fecha_fin = ?, nube_como_respaldo = COALESCE(?, nube_como_respaldo) WHERE id = 1",
        )
        .bind(
          cambios.nombre,
          cambios.logo,
          cambios.fechaInicio,
          cambios.fechaFin,
          cambios.nubeComoRespaldo === undefined ? null : cambios.nubeComoRespaldo ? 1 : 0,
        )
        .run();
      return resultado.meta.changes > 0;
    },

    async borrarTodo() {
      await db.batch([
        db.prepare("DELETE FROM sesion"),
        db.prepare("DELETE FROM intento_ingreso"),
        db.prepare("DELETE FROM evento"),
        db.prepare("DELETE FROM administrador"),
      ]);
    },

    async guardarSesion(tokenHash, sesion, creadaEn, venceEn) {
      await db
        .prepare(
          "INSERT INTO sesion (token_hash, rol, cuenta_id, creada_en, vence_en) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(tokenHash, sesion.rol, sesion.cuentaId, creadaEn, venceEn)
        .run();
      // De paso se limpian las vencidas: la tabla no crece sin límite.
      await db.prepare("DELETE FROM sesion WHERE vence_en < ?").bind(creadaEn).run();
    },

    async leerSesion(tokenHash, ahora) {
      const fila = await db
        .prepare("SELECT rol, cuenta_id FROM sesion WHERE token_hash = ? AND vence_en > ?")
        .bind(tokenHash, ahora)
        .first<{ rol: Rol; cuenta_id: number }>();
      if (!fila) return null;
      const sesion: SesionGuardada = { rol: fila.rol, cuentaId: fila.cuenta_id };
      return sesion;
    },

    async borrarSesion(tokenHash) {
      await db.prepare("DELETE FROM sesion WHERE token_hash = ?").bind(tokenHash).run();
    },

    async borrarSesionesDe(rol, cuentaId) {
      await db
        .prepare("DELETE FROM sesion WHERE rol = ? AND cuenta_id = ?")
        .bind(rol, cuentaId)
        .run();
    },

    async contarIntentos(clave, desde) {
      const fila = await db
        .prepare("SELECT COUNT(*) AS cantidad FROM intento_ingreso WHERE clave = ? AND momento > ?")
        .bind(clave, desde)
        .first<{ cantidad: number }>();
      return fila?.cantidad ?? 0;
    },

    async registrarIntento(clave, ahora) {
      await db
        .prepare("INSERT INTO intento_ingreso (clave, momento) VALUES (?, ?)")
        .bind(clave, ahora)
        .run();
    },

    async borrarIntentos(clave) {
      await db.prepare("DELETE FROM intento_ingreso WHERE clave = ?").bind(clave).run();
    },
  };
}
