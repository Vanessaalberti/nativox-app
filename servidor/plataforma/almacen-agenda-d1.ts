import { esquemaIdioma, validar, type Charla, type Idioma, type Sala } from "@compartido/contratos";
import type { AlmacenAgenda } from "./almacen-agenda";

interface FilaSala {
  id: string;
  nombre: string;
  idioma_original: Idioma;
  idiomas_destino: string;
  charlas: number;
}

interface FilaCharla {
  id: string;
  sala_id: string;
  titulo: string;
  resumen: string;
  oradores: string;
  fecha: string;
  inicio_min: number;
  fin_min: number;
  idioma: Idioma | null;
  glosario: string;
}

const SELECT_SALA = `SELECT s.id, s.nombre, s.idioma_original, s.idiomas_destino,
  (SELECT COUNT(*) FROM charla c WHERE c.sala_id = s.id) AS charlas FROM sala s`;

const SELECT_CHARLA =
  "SELECT id, sala_id, titulo, resumen, oradores, fecha, inicio_min, fin_min, idioma, glosario FROM charla";

// Los idiomas destino se guardan como "en,pt": lo que no sea un idioma conocido se descarta.
function leerIdiomas(texto: string): Idioma[] {
  return texto.split(",").flatMap((parte) => {
    const idioma = validar(esquemaIdioma, parte);
    return idioma.ok ? [idioma.valor] : [];
  });
}

const aSala = (fila: FilaSala): Sala => ({
  id: fila.id,
  nombre: fila.nombre,
  idiomaOriginal: fila.idioma_original,
  idiomasDestino: leerIdiomas(fila.idiomas_destino),
  charlas: fila.charlas,
});

const aCharla = (fila: FilaCharla): Charla => ({
  id: fila.id,
  salaId: fila.sala_id,
  titulo: fila.titulo,
  resumen: fila.resumen,
  oradores: fila.oradores,
  fecha: fila.fecha,
  inicioMin: fila.inicio_min,
  finMin: fila.fin_min,
  idioma: fila.idioma,
  glosario: fila.glosario,
});

const huboCambios = (resultado: D1Result): boolean => resultado.meta.changes > 0;

export function crearAlmacenAgendaD1(db: D1Database): AlmacenAgenda {
  return {
    async crearSalas(salas, ahora) {
      const ultima = await db
        .prepare("SELECT COALESCE(MAX(posicion), 0) AS ultima FROM sala")
        .first<{ ultima: number }>();
      const base = ultima?.ultima ?? 0;
      // Todas o ninguna: un lote falla entero si una fila falla.
      await db.batch(
        salas.map((sala, indice) =>
          db
            .prepare(
              "INSERT INTO sala (id, nombre, idioma_original, idiomas_destino, posicion, creada_en) VALUES (?, ?, ?, ?, ?, ?)",
            )
            .bind(
              sala.id,
              sala.nombre,
              sala.idiomaOriginal,
              sala.idiomasDestino.join(","),
              base + indice + 1,
              ahora,
            ),
        ),
      );
    },

    async listarSalas() {
      const { results } = await db.prepare(`${SELECT_SALA} ORDER BY s.posicion`).all<FilaSala>();
      return results.map(aSala);
    },

    async leerSala(id) {
      const fila = await db.prepare(`${SELECT_SALA} WHERE s.id = ?`).bind(id).first<FilaSala>();
      return fila ? aSala(fila) : null;
    },

    async actualizarSala(id, datos) {
      const resultado = await db
        .prepare(
          "UPDATE sala SET nombre = ?, idioma_original = ?, idiomas_destino = ? WHERE id = ?",
        )
        .bind(datos.nombre, datos.idiomaOriginal, datos.idiomasDestino.join(","), id)
        .run();
      return huboCambios(resultado);
    },

    async borrarSala(id) {
      // Las charlas de la sala se borran solas (ON DELETE CASCADE).
      return huboCambios(await db.prepare("DELETE FROM sala WHERE id = ?").bind(id).run());
    },

    async listarCharlas(salaId) {
      const { results } = await db
        .prepare(`${SELECT_CHARLA} WHERE sala_id = ? ORDER BY fecha, inicio_min`)
        .bind(salaId)
        .all<FilaCharla>();
      return results.map(aCharla);
    },

    async leerCharla(id) {
      const fila = await db.prepare(`${SELECT_CHARLA} WHERE id = ?`).bind(id).first<FilaCharla>();
      return fila ? aCharla(fila) : null;
    },

    async crearCharla(id, salaId, datos, ahora) {
      await db
        .prepare(
          "INSERT INTO charla (id, sala_id, titulo, resumen, oradores, fecha, inicio_min, fin_min, idioma, glosario, creada_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          id,
          salaId,
          datos.titulo,
          datos.resumen,
          datos.oradores,
          datos.fecha,
          datos.inicioMin,
          datos.finMin,
          datos.idioma,
          datos.glosario,
          ahora,
        )
        .run();
    },

    async actualizarCharla(id, datos) {
      const resultado = await db
        .prepare(
          "UPDATE charla SET titulo = ?, resumen = ?, oradores = ?, fecha = ?, inicio_min = ?, fin_min = ?, idioma = ?, glosario = ? WHERE id = ?",
        )
        .bind(
          datos.titulo,
          datos.resumen,
          datos.oradores,
          datos.fecha,
          datos.inicioMin,
          datos.finMin,
          datos.idioma,
          datos.glosario,
          id,
        )
        .run();
      return huboCambios(resultado);
    },

    async borrarTodo() {
      await db.batch([db.prepare("DELETE FROM charla"), db.prepare("DELETE FROM sala")]);
    },

    async borrarCharla(id) {
      return huboCambios(await db.prepare("DELETE FROM charla WHERE id = ?").bind(id).run());
    },
  };
}
