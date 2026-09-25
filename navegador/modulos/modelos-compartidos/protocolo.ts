// Mensajes entre la página y el worker que aloja los modelos. Los dos lados son código de este
// módulo, así que alcanza con revisar el `tipo` al recibir.

// fp16: codificador sin comprimir, para placas con `shader-f16` (rinde mejor).
// q4: comprimido (~0,76 GB), para cualquier placa con WebGPU.
export type VarianteWhisper = "fp16" | "q4";

export interface OpcionesTranscribir {
  // Texto que guía a Whisper: glosario + lo último transcripto (ver compartido/glosario).
  prompt: string;
  idioma: string;
}

export interface PedidoDeTraduccion {
  texto: string;
  de: string;
  a: string;
}

export type Pedido =
  | { tipo: "cargar-whisper"; id: number; variante: VarianteWhisper }
  // TranslateGemma comparte la variante con Whisper: sin f16 va comprimido.
  | { tipo: "cargar-gemma"; id: number; variante: VarianteWhisper }
  | ({ tipo: "traducir-gemma"; id: number } & PedidoDeTraduccion)
  | ({ tipo: "transcribir"; id: number; audio: Float32Array } & OpcionesTranscribir);

export type Respuesta =
  | { tipo: "progreso"; id: number; cargado: number; total: number }
  | { tipo: "cargado"; id: number }
  | { tipo: "transcripto"; id: number; texto: string; ms: number }
  | { tipo: "traducido"; id: number; texto: string; ms: number }
  | { tipo: "error"; id: number; motivo: string };

export function esPedido(dato: unknown): dato is Pedido {
  return tieneTipo(dato, ["cargar-whisper", "cargar-gemma", "transcribir", "traducir-gemma"]);
}

export function esRespuesta(dato: unknown): dato is Respuesta {
  return tieneTipo(dato, ["progreso", "cargado", "transcripto", "traducido", "error"]);
}

function tieneTipo(dato: unknown, tipos: readonly string[]): boolean {
  return (
    typeof dato === "object" &&
    dato !== null &&
    "tipo" in dato &&
    typeof dato.tipo === "string" &&
    tipos.includes(dato.tipo) &&
    "id" in dato &&
    typeof dato.id === "number"
  );
}
