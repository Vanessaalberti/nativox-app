// Misma normalización que usa Whisper para medir: sin mayúsculas, sin tildes y sin puntuación.
// Así el WER cuenta palabras mal reconocidas, no diferencias de formato.
export function palabrasParaMedir(texto: string): string[] {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((palabra) => palabra !== "");
}
