// Para comparar lo que dijo Whisper en dos pasadas: sin tildes, mayúsculas ni puntuación.
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function normalizarPalabra(palabra: string): string {
  return normalizar(palabra).replace(/[^\p{L}\p{N}]/gu, "");
}

export function separarPalabras(texto: string): string[] {
  return texto.split(/\s+/).filter((palabra) => palabra !== "");
}
