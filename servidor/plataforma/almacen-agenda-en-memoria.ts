import type { Charla, DatosDeSala, Sala } from "@compartido/contratos";
import type { AlmacenAgenda } from "./almacen-agenda";

// El mismo almacén, en memoria: lo usan las pruebas de la API (sin D1 ni Workers).
export function crearAlmacenAgendaEnMemoria(): AlmacenAgenda {
  const salas = new Map<string, DatosDeSala>();
  const charlas = new Map<string, Charla>();
  const aSala = (id: string, datos: DatosDeSala): Sala => ({
    id,
    ...datos,
    charlas: [...charlas.values()].filter((charla) => charla.salaId === id).length,
  });

  return {
    crearSalas: (nuevas) => {
      for (const { id, ...datos } of nuevas) salas.set(id, datos);
      return Promise.resolve();
    },
    listarSalas: () => Promise.resolve([...salas].map(([id, datos]) => aSala(id, datos))),
    leerSala: (id) => {
      const datos = salas.get(id);
      return Promise.resolve(datos ? aSala(id, datos) : null);
    },
    actualizarSala: (id, datos) => {
      if (!salas.has(id)) return Promise.resolve(false);
      salas.set(id, datos);
      return Promise.resolve(true);
    },
    borrarSala: (id) => {
      for (const [charlaId, charla] of charlas) {
        if (charla.salaId === id) charlas.delete(charlaId);
      }
      return Promise.resolve(salas.delete(id));
    },
    listarCharlas: (salaId) =>
      Promise.resolve(
        [...charlas.values()]
          .filter((charla) => charla.salaId === salaId)
          .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicioMin - b.inicioMin),
      ),
    leerCharla: (id) => Promise.resolve(charlas.get(id) ?? null),
    crearCharla: (id, salaId, datos) => {
      charlas.set(id, { id, salaId, ...datos });
      return Promise.resolve();
    },
    actualizarCharla: (id, datos) => {
      const actual = charlas.get(id);
      if (!actual) return Promise.resolve(false);
      charlas.set(id, { ...actual, ...datos });
      return Promise.resolve(true);
    },
    borrarCharla: (id) => Promise.resolve(charlas.delete(id)),
  };
}
