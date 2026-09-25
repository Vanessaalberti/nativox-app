import type { Medidas } from "./medicion";
import type { Nivel } from "./niveles";
import type { Equipo } from "./placa";

// Motivos como datos, no como texto: cada interfaz los escribe en su idioma.
export type Motivo =
  | { codigo: "sin-webgpu" }
  | { codigo: "f16-sin-comprimir" }
  | { codigo: "sin-f16-comprimido" }
  | {
      codigo: "pasada-rapida" | "pasada-media" | "pasada-lenta" | "pasada-muy-lenta";
      pasadaMs: number;
    }
  | { codigo: "no-llega-en-vivo"; pasadaMs: number }
  | { codigo: "margen-para-gemma" };

export interface Recomendacion {
  // null si el equipo no puede correr Whisper localmente (sin WebGPU).
  version: "fp16" | "q4" | null;
  // El nivel de la barra de velocidad; 1 si no se pudo medir.
  nivel: Nivel;
  // Bergamot siempre alcanza (~60 ms por idioma). TranslateGemma da más calidad, pero pide una placa
  // con margen y todavía no está integrado: acá solo se dice si el equipo lo aguantaría.
  traductor: "bergamot";
  margenParaGemma: boolean;
  // La transcripción en la nube conviene si el equipo no puede o no llega en vivo ni en el nivel 1.
  usarNube: boolean;
  motivos: Motivo[];
}

// Una pasada por debajo de esto se puede repetir bien seguido; por encima, forma cola. Umbrales del
// laboratorio (placa AMD sin f16: ~2,5 s por pasada, por eso rinde como el nivel 2).
const UMBRAL_NIVEL_4_MS = 600;
const UMBRAL_NIVEL_3_MS = 1200;
const UMBRAL_NIVEL_2_MS = 2500;
// Con frases de ~4 a 8 s, una pasada de más de esto ya no llega ni cortando por frases.
const LIMITE_EN_VIVO_MS = 6000;

export function recomendar(equipo: Equipo, medidas: Medidas | null): Recomendacion {
  if (!equipo.webgpu) {
    return {
      version: null,
      nivel: 1,
      traductor: "bergamot",
      margenParaGemma: false,
      usarNube: true,
      motivos: [{ codigo: "sin-webgpu" }],
    };
  }

  const motivos: Motivo[] = [{ codigo: equipo.f16 ? "f16-sin-comprimir" : "sin-f16-comprimido" }];
  let nivel: Nivel = 2;
  let usarNube = false;

  if (medidas) {
    nivel = nivelPara(medidas.pasadaMs);
    motivos.push({ codigo: codigoDePasada(medidas.pasadaMs), pasadaMs: medidas.pasadaMs });
    if (medidas.pasadaMs > LIMITE_EN_VIVO_MS) {
      usarNube = true;
      motivos.push({ codigo: "no-llega-en-vivo", pasadaMs: medidas.pasadaMs });
    }
  }

  const margenParaGemma = equipo.f16 && medidas !== null && medidas.pasadaMs < UMBRAL_NIVEL_3_MS;
  if (margenParaGemma) motivos.push({ codigo: "margen-para-gemma" });

  return {
    version: equipo.f16 ? "fp16" : "q4",
    nivel,
    traductor: "bergamot",
    margenParaGemma,
    usarNube,
    motivos,
  };
}

function nivelPara(pasadaMs: number): Nivel {
  if (pasadaMs < UMBRAL_NIVEL_4_MS) return 4;
  if (pasadaMs < UMBRAL_NIVEL_3_MS) return 3;
  if (pasadaMs < UMBRAL_NIVEL_2_MS) return 2;
  return 1;
}

function codigoDePasada(pasadaMs: number) {
  if (pasadaMs < UMBRAL_NIVEL_3_MS) return "pasada-rapida" as const;
  if (pasadaMs < UMBRAL_NIVEL_2_MS) return "pasada-media" as const;
  if (pasadaMs < LIMITE_EN_VIVO_MS) return "pasada-lenta" as const;
  return "pasada-muy-lenta" as const;
}
