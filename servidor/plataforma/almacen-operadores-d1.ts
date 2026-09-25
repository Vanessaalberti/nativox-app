import type { Operador } from "@compartido/contratos";
import type { AlmacenOperadores } from "./almacen-operadores";

interface FilaOperador {
  id: number;
  nombre: string;
  ultimo_ingreso: number | null;
}

const aOperador = (fila: FilaOperador, salaIds: string[]): Operador => ({
  id: fila.id,
  nombre: fila.nombre,
  salaIds,
  estado: fila.ultimo_ingreso === null ? "invitado" : "activo",
  ultimoIngreso: fila.ultimo_ingreso,
});

const huboCambios = (resultado: D1Result): boolean => resultado.meta.changes > 0;

export function crearAlmacenOperadoresD1(db: D1Database): AlmacenOperadores {
  const salasDe = async (id: number): Promise<string[]> => {
    const { results } = await db
      .prepare("SELECT sala_id FROM sala_operador WHERE operador_id = ? ORDER BY sala_id")
      .bind(id)
      .all<{ sala_id: string }>();
    return results.map((fila) => fila.sala_id);
  };

  const asignar = (id: number, salaIds: readonly string[]) =>
    salaIds.map((salaId) =>
      db.prepare("INSERT INTO sala_operador (operador_id, sala_id) VALUES (?, ?)").bind(id, salaId),
    );

  return {
    salasDe,

    async listarOperadores() {
      const { results: filas } = await db
        .prepare("SELECT id, nombre, ultimo_ingreso FROM operador ORDER BY id")
        .all<FilaOperador>();
      const { results: asignadas } = await db
        .prepare("SELECT operador_id, sala_id FROM sala_operador ORDER BY sala_id")
        .all<{ operador_id: number; sala_id: string }>();
      return filas.map((fila) =>
        aOperador(
          fila,
          asignadas.filter((a) => a.operador_id === fila.id).map((a) => a.sala_id),
        ),
      );
    },

    async leerOperador(id) {
      const fila = await db
        .prepare("SELECT id, nombre, ultimo_ingreso FROM operador WHERE id = ?")
        .bind(id)
        .first<FilaOperador>();
      return fila ? aOperador(fila, await salasDe(id)) : null;
    },

    async crearOperadores(personas, ahora) {
      // Una persona por vez (hace falta el id que le toca para asignarle las salas); si una falla,
      // se borran las que ya se crearon para no dejar la mitad.
      const creados: number[] = [];
      try {
        for (const persona of personas) {
          const resultado = await db
            .prepare("INSERT INTO operador (nombre, codigo_hash, creado_en) VALUES (?, ?, ?)")
            .bind(persona.nombre, persona.codigoHash, ahora)
            .run();
          const id = resultado.meta.last_row_id;
          creados.push(id);
          if (persona.salaIds.length > 0) await db.batch(asignar(id, persona.salaIds));
        }
      } catch (error) {
        for (const id of creados)
          await db.prepare("DELETE FROM operador WHERE id = ?").bind(id).run();
        throw error;
      }
      return creados;
    },

    async actualizarOperador(id, nombre, salaIds) {
      const resultado = await db
        .prepare("UPDATE operador SET nombre = ? WHERE id = ?")
        .bind(nombre, id)
        .run();
      if (!huboCambios(resultado)) return false;
      await db.batch([
        db.prepare("DELETE FROM sala_operador WHERE operador_id = ?").bind(id),
        ...asignar(id, salaIds),
      ]);
      return true;
    },

    async cambiarCodigo(id, codigoHash) {
      // El ingreso vuelve a "Invitado": el código nuevo todavía no se usó.
      return huboCambios(
        await db
          .prepare("UPDATE operador SET codigo_hash = ?, ultimo_ingreso = NULL WHERE id = ?")
          .bind(codigoHash, id)
          .run(),
      );
    },

    async borrarOperador(id) {
      return huboCambios(await db.prepare("DELETE FROM operador WHERE id = ?").bind(id).run());
    },

    async buscarPorCodigo(codigoHash) {
      return db
        .prepare("SELECT id FROM operador WHERE codigo_hash = ?")
        .bind(codigoHash)
        .first<{ id: number }>();
    },

    async borrarTodo() {
      await db.batch([db.prepare("DELETE FROM sala_operador"), db.prepare("DELETE FROM operador")]);
    },

    async registrarIngreso(id, ahora) {
      await db.prepare("UPDATE operador SET ultimo_ingreso = ? WHERE id = ?").bind(ahora, id).run();
    },
  };
}
