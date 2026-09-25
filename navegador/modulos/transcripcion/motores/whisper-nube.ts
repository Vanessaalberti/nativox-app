import {
  IDIOMAS,
  type Idioma,
  type Resultado,
  type TranscripcionNube,
} from "@compartido/contratos";
import type { Transcriptor } from "../tipos";

// Lo que este motor necesita de afuera: mandar una frase en WAV y recibir el texto. Lo pone quien
// arma la sesión (así el módulo no sabe nada de la red ni de la sesión).
export interface ServicioNube {
  transcribir(
    wav: Uint8Array<ArrayBuffer>,
    idioma: Idioma,
    prompt: string,
  ): Promise<Resultado<TranscripcionNube>>;
}

const FRECUENCIA = 16_000;

// WAV PCM de 16 bits, mono, a 16 kHz: lo que usa Whisper y lo que el servidor sabe medir sin
// decodificar.
export function aWav(muestras: Float32Array): Uint8Array<ArrayBuffer> {
  const datos = new Uint8Array(44 + muestras.length * 2);
  const vista = new DataView(datos.buffer);
  const escribir = (desde: number, texto: string) => {
    for (const [i, letra] of Array.from(texto).entries())
      vista.setUint8(desde + i, letra.charCodeAt(0));
  };
  escribir(0, "RIFF");
  vista.setUint32(4, 36 + muestras.length * 2, true);
  escribir(8, "WAVE");
  escribir(12, "fmt ");
  vista.setUint32(16, 16, true);
  vista.setUint16(20, 1, true);
  vista.setUint16(22, 1, true);
  vista.setUint32(24, FRECUENCIA, true);
  vista.setUint32(28, FRECUENCIA * 2, true);
  vista.setUint16(32, 2, true);
  vista.setUint16(34, 16, true);
  escribir(36, "data");
  vista.setUint32(40, muestras.length * 2, true);
  for (const [i, muestra] of muestras.entries()) {
    const acotada = Math.max(-1, Math.min(1, muestra));
    vista.setInt16(44 + i * 2, acotada < 0 ? acotada * 0x8000 : acotada * 0x7fff, true);
  }
  return datos;
}

// Al fragmento se le pegan adelante los últimos 1,5 s del anterior para que Whisper entienda de
// dónde viene; esas palabras ya se mostraron. La nube devuelve el horario de cada una, así que se
// sacan las que quedan dentro del tramo de contexto (sin comparar texto, que es más frágil).
export function sinElContexto(respuesta: TranscripcionNube, segundosDeContexto: number): string {
  if (segundosDeContexto <= 0 || respuesta.palabras.length === 0) return respuesta.texto;
  return respuesta.palabras
    .filter((palabra) => (palabra.inicio + palabra.fin) / 2 >= segundosDeContexto)
    .map((palabra) => palabra.palabra)
    .join("")
    .trim();
}

const esIdioma = (valor: string): valor is Idioma => (IDIOMAS as readonly string[]).includes(valor);

// Whisper large-v3 turbo en Workers AI con la misma interfaz que el motor local: el corte en
// pausas, el contexto, el filtro de alucinaciones y la traducción son los del resto de la sesión.
// Trabaja por frases de 4 a 8 s: no hay texto provisorio.
export function crearWhisperNube(servicio: ServicioNube): Transcriptor {
  return {
    info: { nombre: "Whisper turbo (Workers AI)", local: false, vadPropio: true },
    async transcribir(audio, { prompt, idioma, segundosDeContexto = 0 }) {
      if (!esIdioma(idioma)) return { ok: false, motivo: `Idioma no soportado: ${idioma}` };
      const inicio = performance.now();
      const respuesta = await servicio.transcribir(aWav(audio), idioma, prompt);
      if (!respuesta.ok) return respuesta;
      return {
        ok: true,
        valor: {
          texto: sinElContexto(respuesta.valor, segundosDeContexto),
          ms: performance.now() - inicio,
        },
      };
    },
  };
}
