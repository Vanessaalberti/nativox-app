import type { Linea } from "@compartido/contratos";

// Cuántas líneas se recuerdan por defecto.
export const MAXIMO_DE_LINEAS = 300;

// Una línea se actualiza por `id` (provisoria → confirmada, corrección) y nunca se duplica: la
// nueva reemplaza a la vieja en su lugar; una línea nueva va al final y las más viejas se olvidan.
export function mezclarLinea(
  lineas: readonly Linea[],
  nueva: Linea,
  maximo = MAXIMO_DE_LINEAS,
): Linea[] {
  const posicion = lineas.findIndex((linea) => linea.id === nueva.id);
  const resultado =
    posicion === -1
      ? [...lineas, nueva]
      : lineas.map((linea, indice) => (indice === posicion ? nueva : linea));
  return resultado.slice(-maximo);
}
