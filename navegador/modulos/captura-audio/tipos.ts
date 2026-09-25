export const FRECUENCIA = 16_000;
// Bloques de 100 ms: lo bastante chicos para cortar a tiempo y sin mandar mensajes de más.
export const MUESTRAS_POR_BLOQUE = 1600;

export interface FuenteAudio {
  id: string;
  nombre: string;
}

export interface OpcionesCaptura {
  // El micrófono de una notebook o un auricular necesita los filtros de voz del navegador
  // (eco, ruido y volumen); la entrada de una consola (el caso de las salas) va sin ellos.
  conFiltrosDeVoz?: boolean;
  alRecibir: (bloque: Float32Array) => void;
  // La pista se cortó sola: cable desconectado, permiso retirado o fin del archivo.
  alTerminar: (motivo: string) => void;
}

export interface Captura {
  detener(): void;
  // Solo con un link: el video que se está reproduciendo, para mostrarlo en pantalla.
  video?: HTMLVideoElement;
}
