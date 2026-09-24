import { buscarCoincidencias, reemplazarCoincidencias } from "./buscar";
import type { EntradaGlosario } from "./leer";

export interface Correccion {
  desde: string;
  hacia: string;
}

// Corrige sin saber qué se dijo: solo arregla lo que se parece a un término del glosario.
// Lo que Whisper escribe muy distinto se resuelve cargando la variante (`término ~ variante`).
export function corregirTranscripcion(
  texto: string,
  entradas: readonly EntradaGlosario[],
): { texto: string; correcciones: Correccion[] } {
  const { palabras, coincidencias } = buscarCoincidencias(texto, entradas, [
    "exacta",
    "sigla-con-barra",
    "intercalada",
    "parecida",
  ]);
  const correcciones: Correccion[] = [];

  const corregido = reemplazarCoincidencias({
    texto,
    palabras,
    coincidencias,
    reemplazar: ({ entrada }, original) => {
      if (original !== entrada.termino) {
        correcciones.push({ desde: original, hacia: entrada.termino });
      }
      return entrada.termino;
    },
  });
  return { texto: corregido, correcciones };
}
