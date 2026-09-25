import { esquemaIdioma, validar, type Linea } from "@compartido/contratos";
import type {
  AccionDeAviso,
  AlmacenOperacion,
  EntradaDelRegistro,
  SegmentoGuardado,
} from "./almacen-operacion";

interface FilaSegmento {
  id: string;
  original: string;
  traducciones: string;
  inicio: number;
  fin: number;
}

// Las traducciones se guardan como JSON: solo se conservan las de idiomas conocidos.
function leerTraducciones(texto: string): Linea["traducciones"] {
  let dato: unknown;
  try {
    dato = JSON.parse(texto);
  } catch {
    return {};
  }
  if (typeof dato !== "object" || dato === null) return {};
  const traducciones: Linea["traducciones"] = {};
  for (const [idioma, valor] of Object.entries(dato)) {
    const conocido = validar(esquemaIdioma, idioma);
    if (conocido.ok && typeof valor === "string") traducciones[conocido.valor] = valor;
  }
  return traducciones;
}

const aSegmento = (fila: FilaSegmento): SegmentoGuardado => ({
  id: fila.id,
  original: fila.original,
  traducciones: leerTraducciones(fila.traducciones),
  inicio: fila.inicio,
  fin: fila.fin,
});

export function crearAlmacenOperacionD1(db: D1Database): AlmacenOperacion {
  return {
    async guardarSegmento(salaId, charlaId, linea, ahora) {
      await db
        .prepare(
          `INSERT INTO segmento (sala_id, id, charla_id, original, traducciones, inicio, fin, creado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (sala_id, id) DO UPDATE SET
             original = excluded.original, traducciones = excluded.traducciones,
             inicio = excluded.inicio, fin = excluded.fin`,
        )
        .bind(
          salaId,
          linea.id,
          charlaId,
          linea.original,
          JSON.stringify(linea.traducciones),
          linea.inicio,
          linea.fin,
          ahora,
        )
        .run();
    },

    async listarSegmentos(charlaId) {
      const { results } = await db
        .prepare(
          "SELECT id, original, traducciones, inicio, fin FROM segmento WHERE charla_id = ? ORDER BY creado_en, inicio",
        )
        .bind(charlaId)
        .all<FilaSegmento>();
      return results.map(aSegmento);
    },

    async crearAccion(tokenHash, salaId, accion, venceEn) {
      await db
        .prepare(
          "INSERT INTO accion_token (token_hash, sala_id, accion, vence_en) VALUES (?, ?, ?, ?)",
        )
        .bind(tokenHash, salaId, accion, venceEn)
        .run();
      // De paso se limpian los vencidos: la tabla no crece sin límite.
      await db
        .prepare("DELETE FROM accion_token WHERE vence_en < ?")
        .bind(venceEn - 86_400_000)
        .run();
    },

    async leerAccion(tokenHash, ahora) {
      const fila = await db
        .prepare(
          "SELECT sala_id, accion FROM accion_token WHERE token_hash = ? AND usado_en IS NULL AND vence_en > ?",
        )
        .bind(tokenHash, ahora)
        .first<{ sala_id: string; accion: AccionDeAviso }>();
      return fila ? { salaId: fila.sala_id, accion: fila.accion } : null;
    },

    async consumirAccion(tokenHash, ahora) {
      // Un solo UPDATE decide quién lo gasta: si dos pedidos llegan a la vez, solo uno lo consigue.
      const fila = await db
        .prepare(
          "UPDATE accion_token SET usado_en = ? WHERE token_hash = ? AND usado_en IS NULL AND vence_en > ? RETURNING sala_id, accion",
        )
        .bind(ahora, tokenHash, ahora)
        .first<{ sala_id: string; accion: AccionDeAviso }>();
      return fila ? { salaId: fila.sala_id, accion: fila.accion } : null;
    },

    async registrarAire(entrada: EntradaDelRegistro) {
      await db
        .prepare("INSERT INTO registro_aire (salida, sala_id, desde) VALUES (?, ?, ?)")
        .bind(entrada.salida, entrada.salaId, entrada.desde)
        .run();
    },

    async listarAire(limite) {
      const { results } = await db
        .prepare("SELECT salida, sala_id, desde FROM registro_aire ORDER BY id DESC LIMIT ?")
        .bind(limite)
        .all<{ salida: number; sala_id: string | null; desde: number }>();
      return results.map((fila) => ({
        salida: fila.salida,
        salaId: fila.sala_id,
        desde: fila.desde,
      }));
    },

    async borrarTodo() {
      await db.batch([
        db.prepare("DELETE FROM segmento"),
        db.prepare("DELETE FROM accion_token"),
        db.prepare("DELETE FROM registro_aire"),
      ]);
    },
  };
}
