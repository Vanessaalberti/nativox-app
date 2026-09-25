import type { Resultado } from "@compartido/contratos";

export interface OpcionesTranscripcion {
  prompt: string;
  idioma: string;
}

export interface InfoMotor {
  nombre: string;
  local: boolean;
  // El motor ya saca los silencios (Workers AI con `vad_filter`); si no, lo hace el cortador.
  vadPropio: boolean;
}

// Misma interfaz para todos los motores (local y nube): lo que mejora la transcripción vive
// afuera del motor y vale para cualquiera.
export interface Transcriptor {
  info: InfoMotor;
  transcribir(
    audio: Float32Array,
    opciones: OpcionesTranscripcion,
  ): Promise<Resultado<{ texto: string; ms: number }>>;
}
