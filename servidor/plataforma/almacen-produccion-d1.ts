import {
  ESTILO_POR_DEFECTO,
  esquemaEstiloSalida,
  validar,
  type EstiloSalida,
  type SalidaDeProduccion,
} from "@compartido/contratos";
import type { AlmacenProduccion } from "./almacen-produccion";

interface FilaSalida {
  numero: number;
  nombre: string;
  sala_al_aire: string | null;
  estilo: string;
}

// El estilo se guarda como JSON: si lo guardado no se puede leer, se descarta y se usa el estilo
// por defecto de quien lo pide (mejor eso que una página de subtítulos rota en pleno evento).
function leerEstilo(texto: string | null): EstiloSalida | null {
  if (texto === null) return null;
  try {
    const estilo = validar(esquemaEstiloSalida, JSON.parse(texto));
    return estilo.ok ? estilo.valor : null;
  } catch {
    return null;
  }
}

const huboCambios = (resultado: D1Result): boolean => resultado.meta.changes > 0;

export function crearAlmacenProduccionD1(db: D1Database): AlmacenProduccion {
  const aSalida = (fila: FilaSalida): SalidaDeProduccion => ({
    numero: fila.numero,
    nombre: fila.nombre,
    salaAlAire: fila.sala_al_aire,
    estilo: leerEstilo(fila.estilo) ?? ESTILO_POR_DEFECTO,
  });

  return {
    async leerEstiloDeSala(salaId) {
      const fila = await db
        .prepare("SELECT estilo FROM sala WHERE id = ?")
        .bind(salaId)
        .first<{ estilo: string | null }>();
      return leerEstilo(fila?.estilo ?? null);
    },

    async guardarEstiloDeSala(salaId, estilo) {
      return huboCambios(
        await db
          .prepare("UPDATE sala SET estilo = ? WHERE id = ?")
          .bind(JSON.stringify(estilo), salaId)
          .run(),
      );
    },

    async listarSalidas() {
      const { results } = await db
        .prepare("SELECT numero, nombre, sala_al_aire, estilo FROM salida ORDER BY numero")
        .all<FilaSalida>();
      return results.map(aSalida);
    },

    async leerSalida(numero) {
      const fila = await db
        .prepare("SELECT numero, nombre, sala_al_aire, estilo FROM salida WHERE numero = ?")
        .bind(numero)
        .first<FilaSalida>();
      return fila ? aSalida(fila) : null;
    },

    async crearSalida(nombre, estilo, ahora) {
      const fila = await db
        .prepare(
          "INSERT INTO salida (numero, nombre, estilo, creada_en) VALUES ((SELECT COALESCE(MAX(numero), 0) + 1 FROM salida), ?, ?, ?) RETURNING numero, nombre, sala_al_aire, estilo",
        )
        .bind(nombre, JSON.stringify(estilo), ahora)
        .first<FilaSalida>();
      if (!fila) throw new Error("No se pudo crear la salida.");
      return aSalida(fila);
    },

    async actualizarSalida(numero, datos) {
      return huboCambios(
        await db
          .prepare("UPDATE salida SET nombre = ?, sala_al_aire = ?, estilo = ? WHERE numero = ?")
          .bind(datos.nombre, datos.salaAlAire, JSON.stringify(datos.estilo), numero)
          .run(),
      );
    },

    async borrarTodo() {
      await db.prepare("DELETE FROM salida").run();
    },

    async borrarSalida(numero) {
      return huboCambios(
        await db.prepare("DELETE FROM salida WHERE numero = ?").bind(numero).run(),
      );
    },
  };
}
