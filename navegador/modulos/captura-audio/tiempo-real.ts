export interface Reloj {
  ahoraMs(): number;
}

// Entrega un audio ya decodificado al ritmo en que se diría, sin reproducirlo: así un archivo de
// prueba se comporta igual que el micrófono. Cada llamada a `avanzar` manda los bloques que ya
// "sonaron" según el reloj, y compensa si un temporizador llegó tarde.
export function crearEmisorEnTiempoReal(opciones: {
  audio: Float32Array;
  frecuencia: number;
  muestrasPorBloque: number;
  reloj: Reloj;
  alRecibir: (bloque: Float32Array) => void;
}): { avanzar(): boolean } {
  const { audio, frecuencia, muestrasPorBloque, reloj, alRecibir } = opciones;
  const inicioMs = reloj.ahoraMs();
  let enviadas = 0;

  return {
    // Devuelve si todavía queda audio por mandar.
    avanzar() {
      const debidas = Math.min(
        audio.length,
        Math.floor(((reloj.ahoraMs() - inicioMs) / 1000) * frecuencia),
      );
      while (
        debidas - enviadas >= muestrasPorBloque ||
        (debidas === audio.length && enviadas < debidas)
      ) {
        const hasta = Math.min(enviadas + muestrasPorBloque, audio.length);
        alRecibir(audio.slice(enviadas, hasta));
        enviadas = hasta;
      }
      return enviadas < audio.length;
    },
  };
}
