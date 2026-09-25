import type { Nivel } from "./niveles";
import type { Equipo } from "./placa";

// Lo que se midió de la placa (ver `medirRendimiento`) y lo que se estima a partir de eso.
export interface Medidas {
  gflops: number;
  // Cuánto tardaría una pasada de Whisper en esta placa. Es una ESTIMACIÓN a partir de la potencia
  // medida; la pasada real se ve al probar.
  pasadaEstimadaMs: number;
}

// Calibración: la placa de referencia (AMD GCN 4, sin f16) dio esta potencia (mediana de 5 corridas
// del benchmark: 1020 a 1076) y una pasada real de
// Whisper de 2,8 s (medido el 25/09 con Whisper comprimido). Las demás se estiman en proporción.
// Es conservador con las placas con f16, que corren Whisper sin comprimir y rinden mejor.
const GFLOPS_DE_REFERENCIA = 1030;
const PASADA_DE_REFERENCIA_MS = 2800;

export function estimarPasada(gflops: number): number {
  if (!(gflops > 0)) return Number.POSITIVE_INFINITY;
  return Math.round((PASADA_DE_REFERENCIA_MS * GFLOPS_DE_REFERENCIA) / gflops);
}

// Motivos como datos, no como texto: cada interfaz los escribe en su idioma.
export type Motivo =
  | { codigo: "sin-webgpu" }
  | { codigo: "f16-sin-comprimir" }
  | { codigo: "sin-f16-comprimido" }
  | { codigo: "poca-memoria"; memoriaGb: number }
  | {
      codigo: "pasada-rapida" | "pasada-media" | "pasada-lenta" | "pasada-muy-lenta";
      pasadaMs: number;
    }
  | { codigo: "no-llega-en-vivo"; pasadaMs: number }
  | { codigo: "margen-para-gemma" }
  | { codigo: "gemma-pide-memoria" };

export interface Recomendacion {
  // null si el equipo no puede correr Whisper localmente (sin WebGPU).
  version: "fp16" | "q4" | null;
  // El nivel de la barra de velocidad; 1 si no se pudo medir.
  nivel: Nivel;
  // Bergamot siempre alcanza (~60 ms por idioma). TranslateGemma da más calidad, pero pide una placa
  // con margen: acá solo se dice si el equipo lo aguantaría; elegirlo lo decide quien usa el módulo.
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
// Con poca RAM el navegador no aguanta los modelos y el resto de la pestaña (Chrome informa hasta 8).
const RAM_JUSTA_GB = 4;
// TranslateGemma carga un modelo de ~2 GB: el navegador tiene que dejar pedir buffers así de grandes.
const BUFFER_PARA_GEMMA_MB = 2048;

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
  const pocaRam = equipo.memoriaGb !== null && equipo.memoriaGb <= RAM_JUSTA_GB;
  if (pocaRam && equipo.memoriaGb !== null) {
    motivos.push({ codigo: "poca-memoria", memoriaGb: equipo.memoriaGb });
  }

  let nivel: Nivel = 2;
  let usarNube = false;
  if (medidas) {
    nivel = nivelPara(medidas.pasadaEstimadaMs);
    motivos.push({
      codigo: codigoDePasada(medidas.pasadaEstimadaMs),
      pasadaMs: medidas.pasadaEstimadaMs,
    });
    if (medidas.pasadaEstimadaMs > LIMITE_EN_VIVO_MS) {
      usarNube = true;
      motivos.push({ codigo: "no-llega-en-vivo", pasadaMs: medidas.pasadaEstimadaMs });
    }
  }

  const buffer = equipo.bufferMaximoMb;
  const sinLugarParaGemma = pocaRam || (buffer !== null && buffer < BUFFER_PARA_GEMMA_MB);
  const rapida = medidas !== null && medidas.pasadaEstimadaMs < UMBRAL_NIVEL_3_MS;
  const margenParaGemma = equipo.f16 && rapida && !sinLugarParaGemma;
  if (margenParaGemma) motivos.push({ codigo: "margen-para-gemma" });
  else if (sinLugarParaGemma) motivos.push({ codigo: "gemma-pide-memoria" });

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
