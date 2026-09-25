import type { Resultado } from "@compartido/contratos";
import type { OpcionesTranscripcion, Transcriptor } from "../tipos";

// Lo que este motor necesita de quien aloja el modelo (el worker de modelos-compartidos). Entra
// por parámetro: así el motor se prueba sin placa de video.
export interface ServicioWhisper {
  transcribir(
    audio: Float32Array,
    opciones: OpcionesTranscripcion,
  ): Promise<Resultado<{ texto: string; ms: number }>>;
}

export function crearWhisperLocal(servicio: ServicioWhisper): Transcriptor {
  return {
    info: { nombre: "Whisper large-v3 turbo (en esta computadora)", local: true, vadPropio: false },
    transcribir: (audio, opciones) => servicio.transcribir(audio, opciones),
  };
}
