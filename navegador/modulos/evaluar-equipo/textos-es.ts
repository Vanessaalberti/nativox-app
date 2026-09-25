import type { Nivel } from "./niveles";
import type { Motivo } from "./recomendacion";

// Los nombres del nivel y las explicaciones de la recomendación, en español (la landing tiene los
// suyos en cada idioma).
export const NOMBRES_DE_NIVEL: Record<Nivel, string> = {
  1: "Ahorro",
  2: "Equilibrado",
  3: "Rápido",
  4: "Máximo",
};

export const segundos = (ms: number) =>
  Number.isFinite(ms) ? `${(ms / 1000).toLocaleString("es", { maximumFractionDigits: 1 })} s` : "—";

export function explicarMotivo(motivo: Motivo): string {
  switch (motivo.codigo) {
    case "sin-webgpu":
      return "Esta computadora o este navegador no tiene WebGPU, que hace falta para correr Whisper en la placa.";
    case "f16-sin-comprimir":
      return "La placa soporta 16 bits: Whisper corre sin comprimir, con mejor calidad.";
    case "sin-f16-comprimido":
      return "La placa no soporta 16 bits: Whisper corre comprimido (4 bits), que rinde bien en equipos más modestos.";
    case "poca-memoria":
      return `Tiene poca memoria (${String(motivo.memoriaGb)} GB): conviene cerrar otras pestañas durante el evento.`;
    case "pasada-rapida":
      return `Estimamos ${segundos(motivo.pasadaMs)} por pasada de Whisper: alcanza para actualizar el texto muy seguido.`;
    case "pasada-media":
      return `Estimamos ${segundos(motivo.pasadaMs)} por pasada de Whisper: el texto provisorio se actualiza cada un par de segundos.`;
    case "pasada-lenta":
      return `Estimamos ${segundos(motivo.pasadaMs)} por pasada de Whisper: conviene mostrar frases completas para que no se acumule cola.`;
    case "pasada-muy-lenta":
      return `Estimamos ${segundos(motivo.pasadaMs)} por pasada de Whisper: es más de lo que dura una frase.`;
    case "no-llega-en-vivo":
      return `Con ${segundos(motivo.pasadaMs)} por pasada el texto se atrasaría más y más, incluso con frases completas.`;
    case "margen-para-gemma":
      return "La placa es potente y tiene 16 bits: tendría margen para un traductor de más calidad.";
    case "gemma-pide-memoria":
      return "TranslateGemma pide un modelo de ~2 GB y esta computadora no tiene memoria de sobra: conviene Bergamot.";
  }
}
