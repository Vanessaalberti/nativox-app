import type { EstiloSalida, SalidaDeProduccion } from "@compartido/contratos";
import type { AlmacenProduccion } from "./almacen-produccion";

// El mismo almacén, en memoria: lo usan las pruebas de la API (sin D1 ni Workers).
export function crearAlmacenProduccionEnMemoria(
  salasExistentes: () => Promise<string[]>,
): AlmacenProduccion {
  const estilos = new Map<string, EstiloSalida>();
  const salidas = new Map<number, SalidaDeProduccion>();

  return {
    leerEstiloDeSala: (salaId) => Promise.resolve(estilos.get(salaId) ?? null),
    guardarEstiloDeSala: async (salaId, estilo) => {
      if (!(await salasExistentes()).includes(salaId)) return false;
      estilos.set(salaId, estilo);
      return true;
    },
    listarSalidas: () => Promise.resolve([...salidas.values()].sort((a, b) => a.numero - b.numero)),
    leerSalida: (numero) => Promise.resolve(salidas.get(numero) ?? null),
    crearSalida: (nombre, estilo) => {
      const numero = Math.max(0, ...salidas.keys()) + 1;
      const salida = { numero, nombre, salaAlAire: null, estilo };
      salidas.set(numero, salida);
      return Promise.resolve(salida);
    },
    actualizarSalida: (numero, datos) => {
      if (!salidas.has(numero)) return Promise.resolve(false);
      salidas.set(numero, { numero, ...datos });
      return Promise.resolve(true);
    },
    borrarSalida: (numero) => Promise.resolve(salidas.delete(numero)),
    borrarTodo: () => {
      salidas.clear();
      estilos.clear();
      return Promise.resolve();
    },
  };
}
