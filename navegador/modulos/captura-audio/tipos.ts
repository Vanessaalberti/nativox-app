export const FRECUENCIA = 16_000;
// Bloques de 100 ms: lo bastante chicos para cortar a tiempo y sin mandar mensajes de más.
export const MUESTRAS_POR_BLOQUE = 1600;

export interface FuenteAudio {
  id: string;
  nombre: string;
}

export interface OpcionesCaptura {
  alRecibir: (bloque: Float32Array) => void;
  // La pista se cortó sola: cable desconectado, permiso retirado o fin del archivo.
  alTerminar: (motivo: string) => void;
}

export interface Captura {
  detener(): void;
}
