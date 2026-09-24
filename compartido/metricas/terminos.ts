import { palabrasParaMedir } from "./texto";

// Cuántas apariciones de los términos de la referencia quedaron bien escritas en la hipótesis.
// Si "GitHub" aparece dos veces en la referencia y una en la hipótesis, suma 1 de 2.
export function contarTerminos(
  referencia: string,
  hipotesis: string,
  terminos: readonly string[],
): { bien: number; total: number } {
  const esperadas = palabrasParaMedir(referencia);
  const obtenidas = palabrasParaMedir(hipotesis);
  let bien = 0;
  let total = 0;

  for (const termino of new Set(terminos)) {
    const buscadas = palabrasParaMedir(termino);
    const enReferencia = contarApariciones(esperadas, buscadas);
    total += enReferencia;
    bien += Math.min(enReferencia, contarApariciones(obtenidas, buscadas));
  }
  return { bien, total };
}

function contarApariciones(palabras: readonly string[], buscadas: readonly string[]): number {
  if (buscadas.length === 0) return 0;
  let apariciones = 0;
  for (let i = 0; i + buscadas.length <= palabras.length; i++) {
    if (buscadas.every((buscada, j) => palabras[i + j] === buscada)) apariciones++;
  }
  return apariciones;
}
