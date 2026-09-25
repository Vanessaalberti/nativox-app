import { normalizarPalabra, separarPalabras } from "./texto";

// El contexto de audio (1,5 s del fragmento anterior pegados adelante) hace que el principio de
// la transcripción nueva repita el final de la anterior. En local no hay horarios por palabra:
// se busca el tramo más largo en que el final de lo anterior aparece al principio de lo nuevo y
// se borra hasta ahí. 1,5 s de habla son ~4 a 6 palabras; se mira hasta 10 por si se habla rápido.
const MAXIMO_PALABRAS_REPETIDAS = 10;
// Los 1,5 s pueden empezar a mitad de una palabra: Whisper la escribe cortada o parecida
// ("an do for you" por "can do for you"). Se permiten hasta 2 palabras sueltas antes.
const MAXIMO_PALABRAS_SUELTAS = 2;
// Una sola palabra repetida solo se borra si es larga: "y", "de" o "la" se repiten de verdad.
const LARGO_MINIMO_DE_UNA_SOLA = 4;

export function borrarSuperposicion(anterior: string, nuevo: string): string {
  const previas = separarPalabras(anterior).map(normalizarPalabra);
  const palabras = separarPalabras(nuevo);
  const nuevas = palabras.map(normalizarPalabra);

  const maximo = Math.min(MAXIMO_PALABRAS_REPETIDAS, previas.length, nuevas.length);
  for (let largo = maximo; largo >= 1; largo--) {
    const final = previas.slice(-largo);
    if (largo === 1 && (final[0]?.length ?? 0) < LARGO_MINIMO_DE_UNA_SOLA) continue;
    const desde = buscarAlPrincipio(nuevas, final);
    if (desde !== null) return palabras.slice(desde + largo).join(" ");
  }
  return palabras.join(" ");
}

function buscarAlPrincipio(nuevas: readonly string[], buscadas: readonly string[]): number | null {
  for (let desde = 0; desde <= MAXIMO_PALABRAS_SUELTAS; desde++) {
    const coincide = buscadas.every(
      (palabra, i) => palabra !== "" && palabra === nuevas[desde + i],
    );
    if (coincide) return desde;
  }
  return null;
}
