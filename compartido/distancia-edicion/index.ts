// Distancia de Levenshtein entre dos secuencias: cuántas inserciones, borrados o reemplazos
// hacen falta para pasar de una a otra. Sirve para letras (parecido de un término) y para
// palabras (WER). Guarda solo dos filas: memoria proporcional al largo de `b`.
export function distanciaEdicion<T>(a: readonly T[], b: readonly T[]): number {
  let anterior = Array.from({ length: b.length + 1 }, (_, indice) => indice);

  for (const [i, elementoA] of a.entries()) {
    const actual = [i + 1];
    for (const [j, elementoB] of b.entries()) {
      const reemplazo = (anterior[j] ?? 0) + (elementoA === elementoB ? 0 : 1);
      const borrado = (anterior[j + 1] ?? 0) + 1;
      const insercion = (actual[j] ?? 0) + 1;
      actual.push(Math.min(reemplazo, borrado, insercion));
    }
    anterior = actual;
  }
  return anterior[b.length] ?? 0;
}
