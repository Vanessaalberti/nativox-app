export type { InfoMotor, OpcionesTranscripcion, Transcriptor } from "./tipos";
export { crearWhisperLocal, type ServicioWhisper } from "./motores/whisper-local";
export { limpiarAlucinaciones, transcribirSinAlucinaciones } from "./alucinaciones";
export { borrarSuperposicion } from "./superposicion";
export { crearAcuerdoLocal, type AcuerdoLocal } from "./en-vivo/acuerdo-local";
