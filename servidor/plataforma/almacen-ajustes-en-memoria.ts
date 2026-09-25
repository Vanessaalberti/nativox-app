import type { AlmacenAjustes } from "./almacen-ajustes";

// El mismo almacén, en memoria: lo usan las pruebas de la API (sin D1 ni Workers).
export function crearAlmacenAjustesEnMemoria(): AlmacenAjustes {
  const guardados = new Map<string, string>();
  return {
    leer: (clave) => Promise.resolve(guardados.get(clave) ?? null),
    guardar: (clave, valor) => {
      guardados.set(clave, valor);
      return Promise.resolve();
    },
    borrar: (clave) => {
      guardados.delete(clave);
      return Promise.resolve();
    },
    borrarTodo: () => {
      guardados.clear();
      return Promise.resolve();
    },
  };
}
