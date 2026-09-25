import { env, pipeline, type ProgressInfo } from "@huggingface/transformers";
import { crearCacheEnDisco } from "./cache-en-disco";
import type { VarianteWhisper } from "./protocolo";

// TranslateGemma 4B de Google, en su versión de solo texto para el navegador (WebGPU).
const MODELO = "onnx-community/translategemma-text-4b-it-ONNX";

// Con `shader-f16` el modelo pesa ~2,1 GB (q4f16); sin eso, ~3,1 GB (q4). Es la misma decisión que
// se toma para Whisper, así que se reutiliza su variante.
const TIPOS_DE_DATO: Record<VarianteWhisper, "q4f16" | "q4"> = { fp16: "q4f16", q4: "q4" };

// El modelo pide el código de cada idioma; para el portugués, el de Brasil.
const CODIGOS_DE_IDIOMA: Record<string, string> = { es: "es", en: "en", pt: "pt_BR" };

// Una frase de subtítulo son pocas decenas de tokens: más que esto sería un modelo divagando.
const MAXIMO_TOKENS_NUEVOS = 256;

export interface Gemma {
  traducir(pedido: { texto: string; de: string; a: string }): Promise<string>;
}

interface Generador {
  (mensajes: object[], opciones: { max_new_tokens: number; do_sample: boolean }): Promise<unknown>;
}

export async function cargarGemma(
  variante: VarianteWhisper,
  alAvanzar: (cargado: number, total: number) => void,
): Promise<Gemma> {
  // Igual que Whisper, queda guardado en el disco del navegador (OPFS): la segunda vez carga sin
  // internet. La caché es una propiedad global del worker: se fija justo antes de cargar.
  env.useCustomCache = true;
  env.customCache = crearCacheEnDisco("modelos-gemma");
  const generador = (await pipeline("text-generation", MODELO, {
    device: "webgpu",
    dtype: TIPOS_DE_DATO[variante],
    progress_callback: (info: ProgressInfo) => {
      if (info.status === "progress_total") alAvanzar(info.loaded, info.total);
    },
  })) as unknown as Generador;

  const gemma = crearGemma(generador);
  // La primera traducción prepara la placa y tarda ~9 s más: se hace ahora, no con el primer
  // subtítulo.
  await gemma.traducir({ texto: "Hola.", de: "es", a: "en" });
  return gemma;
}

function crearGemma(generar: Generador): Gemma {
  return {
    async traducir({ texto, de, a }) {
      const desde = CODIGOS_DE_IDIOMA[de];
      const hacia = CODIGOS_DE_IDIOMA[a];
      if (!desde || !hacia) throw new Error(`TranslateGemma no traduce de "${de}" a "${a}"`);
      const mensajes = [
        {
          role: "user",
          content: [
            { type: "text", source_lang_code: desde, target_lang_code: hacia, text: texto },
          ],
        },
      ];
      const salida = await generar(mensajes, {
        max_new_tokens: MAXIMO_TOKENS_NUEVOS,
        do_sample: false,
      });
      return ultimaRespuesta(salida);
    },
  };
}

// La salida es [{ generated_text: [...mensajes, { role: "assistant", content }] }].
function ultimaRespuesta(salida: unknown): string {
  const primera: unknown = Array.isArray(salida) ? salida[0] : null;
  const texto: unknown =
    typeof primera === "object" && primera !== null && "generated_text" in primera
      ? primera.generated_text
      : null;
  const ultimo: unknown = Array.isArray(texto) ? texto.at(-1) : null;
  const contenido: unknown =
    typeof ultimo === "object" && ultimo !== null && "content" in ultimo ? ultimo.content : null;
  if (typeof contenido !== "string") {
    throw new Error("TranslateGemma devolvió un resultado inesperado (se esperaba texto)");
  }
  return contenido.trim();
}
