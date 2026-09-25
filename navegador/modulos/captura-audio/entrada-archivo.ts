import type { Resultado } from "@compartido/contratos";
import { crearEmisorEnTiempoReal } from "./tiempo-real";
import { FRECUENCIA, MUESTRAS_POR_BLOQUE, type Captura, type OpcionesCaptura } from "./tipos";

const MS_ENTRE_ENTREGAS = 50;

// Un archivo de audio (los de `muestras/`) entregado en tiempo real y sin sonar, como si lo
// estuviera diciendo alguien en la sala.
export async function abrirArchivo(
  archivo: Blob,
  { alRecibir, alTerminar }: OpcionesCaptura,
): Promise<Resultado<Captura>> {
  const audio = await decodificarA16k(archivo);
  if (!audio.ok) return audio;

  const emisor = crearEmisorEnTiempoReal({
    audio: audio.valor,
    frecuencia: FRECUENCIA,
    muestrasPorBloque: MUESTRAS_POR_BLOQUE,
    reloj: { ahoraMs: () => performance.now() },
    alRecibir,
  });
  const temporizador = setInterval(() => {
    if (!emisor.avanzar()) {
      clearInterval(temporizador);
      alTerminar("Terminó el archivo de audio.");
    }
  }, MS_ENTRE_ENTREGAS);

  return { ok: true, valor: { detener: () => clearInterval(temporizador) } };
}

// El contexto a 16 kHz remuestrea al decodificar; después se pasa a mono promediando canales.
async function decodificarA16k(archivo: Blob): Promise<Resultado<Float32Array>> {
  try {
    const contexto = new OfflineAudioContext({
      numberOfChannels: 1,
      length: 1,
      sampleRate: FRECUENCIA,
    });
    const decodificado = await contexto.decodeAudioData(await archivo.arrayBuffer());
    const mono = new Float32Array(decodificado.length);
    for (let canal = 0; canal < decodificado.numberOfChannels; canal++) {
      const datos = decodificado.getChannelData(canal);
      for (let i = 0; i < mono.length; i++) {
        mono[i] = (mono[i] ?? 0) + (datos[i] ?? 0) / decodificado.numberOfChannels;
      }
    }
    return { ok: true, valor: mono };
  } catch (error) {
    return {
      ok: false,
      motivo: `No se pudo leer el archivo de audio (${error instanceof Error ? error.message : String(error)}). Probá con WAV, MP3, OGG u Opus.`,
    };
  }
}
