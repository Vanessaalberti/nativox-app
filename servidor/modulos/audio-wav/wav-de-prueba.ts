// Un WAV PCM de 16 bits mono de silencio, con el encabezado de 44 bytes: para probar lo que recibe
// audio sin tener que grabar nada.
export function wavDeSilencio(segundos: number, frecuencia = 16_000): Uint8Array<ArrayBuffer> {
  const datos = new Uint8Array(44 + Math.round(segundos * frecuencia) * 2);
  const vista = new DataView(datos.buffer);
  datos.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  datos.set([0x57, 0x41, 0x56, 0x45], 8); // WAVE
  datos.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  vista.setUint16(20, 1, true);
  vista.setUint16(22, 1, true);
  vista.setUint32(24, frecuencia, true);
  vista.setUint16(34, 16, true);
  return datos;
}
