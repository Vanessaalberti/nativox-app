import type { Operador } from "@compartido/contratos";
import type { AlmacenOperadores } from "./almacen-operadores";

interface Guardado {
  nombre: string;
  codigoHash: string;
  salaIds: string[];
  ultimoIngreso: number | null;
}

// El mismo almacén, en memoria: lo usan las pruebas de la API (sin D1 ni Workers).
export function crearAlmacenOperadoresEnMemoria(): AlmacenOperadores {
  const personas = new Map<number, Guardado>();
  let siguiente = 1;
  const aOperador = (id: number, guardado: Guardado): Operador => ({
    id,
    nombre: guardado.nombre,
    salaIds: [...guardado.salaIds].sort(),
    estado: guardado.ultimoIngreso === null ? "invitado" : "activo",
    ultimoIngreso: guardado.ultimoIngreso,
  });

  return {
    listarOperadores: () =>
      Promise.resolve([...personas].map(([id, guardado]) => aOperador(id, guardado))),
    leerOperador: (id) => {
      const guardado = personas.get(id);
      return Promise.resolve(guardado ? aOperador(id, guardado) : null);
    },
    crearOperadores: (nuevas) => {
      const ids = nuevas.map((persona) => {
        const id = siguiente++;
        personas.set(id, {
          nombre: persona.nombre,
          codigoHash: persona.codigoHash,
          salaIds: [...persona.salaIds],
          ultimoIngreso: null,
        });
        return id;
      });
      return Promise.resolve(ids);
    },
    actualizarOperador: (id, nombre, salaIds) => {
      const guardado = personas.get(id);
      if (!guardado) return Promise.resolve(false);
      personas.set(id, { ...guardado, nombre, salaIds: [...salaIds] });
      return Promise.resolve(true);
    },
    cambiarCodigo: (id, codigoHash) => {
      const guardado = personas.get(id);
      if (!guardado) return Promise.resolve(false);
      personas.set(id, { ...guardado, codigoHash, ultimoIngreso: null });
      return Promise.resolve(true);
    },
    borrarOperador: (id) => Promise.resolve(personas.delete(id)),
    buscarPorCodigo: (codigoHash) => {
      const encontrado = [...personas].find(([, guardado]) => guardado.codigoHash === codigoHash);
      return Promise.resolve(encontrado ? { id: encontrado[0] } : null);
    },
    registrarIngreso: (id, ahora) => {
      const guardado = personas.get(id);
      if (guardado) guardado.ultimoIngreso = ahora;
      return Promise.resolve();
    },
    borrarTodo: () => {
      personas.clear();
      return Promise.resolve();
    },
    salasDe: (id) => Promise.resolve([...(personas.get(id)?.salaIds ?? [])].sort()),
  };
}
