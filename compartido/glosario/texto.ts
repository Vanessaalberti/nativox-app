export interface Palabra {
  texto: string;
  normal: string;
  inicio: number;
  fin: number;
}

// Una palabra puede llevar adentro barra, guion, apóstrofo o punto ("CI/CD", "Node.js", "3.5"),
// pero no al final: "localhost," es la palabra "localhost".
const PATRON_PALABRA = /[\p{L}\p{N}]+(?:[/\-'’.][\p{L}\p{N}]+)*/gu;

// Sin tildes y en minúsculas: Whisper no es constante con ninguna de las dos.
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function separarPalabras(texto: string): Palabra[] {
  return [...texto.matchAll(PATRON_PALABRA)].map((coincidencia) => ({
    texto: coincidencia[0],
    normal: normalizar(coincidencia[0]),
    inicio: coincidencia.index,
    fin: coincidencia.index + coincidencia[0].length,
  }));
}

// Dos palabras de un término tienen que estar separadas solo por espacios: un término no se
// arma a través de una coma o de un punto.
export function estanJuntas(texto: string, anterior: Palabra, siguiente: Palabra): boolean {
  return /^\s+$/.test(texto.slice(anterior.fin, siguiente.inicio));
}
