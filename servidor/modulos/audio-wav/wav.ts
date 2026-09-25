import type { Resultado } from "@compartido/contratos";

// El navegador manda WAV PCM de 16 bits, mono, a 16 kHz (lo que usa Whisper): así se puede medir
// la duración sin decodificar nada y rechazar lo que pase del límite antes de gastar un pedido.
const FRECUENCIA = 16_000;
const BYTES_POR_SEGUNDO = FRECUENCIA * 2;
const LARGO_ENCABEZADO = 44;

export function validarWav(
  datos: Uint8Array,
  maximoSegundos: number,
): Resultado<{ segundos: number }> {
  if (datos.length < LARGO_ENCABEZADO) return { ok: false, motivo: "El audio llegó vacío." };
  const vista = new DataView(datos.buffer, datos.byteOffset, datos.byteLength);
  const texto = (desde: number) => String.fromCharCode(...datos.subarray(desde, desde + 4));

  const esWav = texto(0) === "RIFF" && texto(8) === "WAVE" && texto(12) === "fmt ";
  const formatoEsperado =
    vista.getUint16(20, true) === 1 &&
    vista.getUint16(22, true) === 1 &&
    vista.getUint32(24, true) === FRECUENCIA &&
    vista.getUint16(34, true) === 16;
  if (!esWav || !formatoEsperado) {
    return { ok: false, motivo: "El audio tiene que ser WAV PCM de 16 bits, mono, a 16 kHz." };
  }

  const segundos = (datos.length - LARGO_ENCABEZADO) / BYTES_POR_SEGUNDO;
  // Medio segundo de tolerancia: la captura se corta en bloques de 100 ms.
  if (segundos > maximoSegundos + 0.5) {
    return {
      ok: false,
      motivo: `El audio dura ${segundos.toFixed(1)} s y el máximo es ${String(maximoSegundos)} s.`,
    };
  }
  return { ok: true, valor: { segundos } };
}
