// La barra de velocidad: cuánto trabajo le pide la sesión en vivo a la placa de video. Sube el
// nivel y el texto aparece antes, pero Whisper se vuelve a correr más seguido sobre lo que se
// viene diciendo (texto provisorio); en una placa lenta eso forma cola.
export type Nivel = 1 | 2 | 3 | 4;

export interface InfoNivel {
  nivel: Nivel;
  // Cada cuánto se muestra lo que se viene diciendo; 0 = solo frases completas (corte en pausas).
  pasadaProvisoriaCadaMs: number;
}

export const NIVELES: readonly InfoNivel[] = [
  { nivel: 1, pasadaProvisoriaCadaMs: 0 },
  { nivel: 2, pasadaProvisoriaCadaMs: 2000 },
  { nivel: 3, pasadaProvisoriaCadaMs: 1000 },
  // "Lo más seguido que dé la placa": la sesión nunca solapa dos pasadas, así que si una pasada
  // tarda más que esto, simplemente va una detrás de otra.
  { nivel: 4, pasadaProvisoriaCadaMs: 400 },
];

export function pasadaProvisoriaDelNivel(nivel: Nivel): number {
  return (NIVELES.find((info) => info.nivel === nivel) ?? NIVELES[0])?.pasadaProvisoriaCadaMs ?? 0;
}
