export function aHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function deHex(texto: string): Uint8Array<ArrayBuffer> | null {
  if (texto.length === 0 || texto.length % 2 !== 0 || !/^[0-9a-f]+$/.test(texto)) return null;
  const bytes = new Uint8Array(texto.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(texto.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
