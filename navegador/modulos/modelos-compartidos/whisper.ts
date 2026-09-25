import {
  AutoProcessor,
  AutoTokenizer,
  Tensor,
  WhisperForConditionalGeneration,
  env,
  type PreTrainedTokenizer,
  type ProgressInfo,
} from "@huggingface/transformers";
import { crearCacheEnDisco } from "./cache-en-disco";
import type { OpcionesTranscribir, VarianteWhisper } from "./protocolo";

const MODELO = "onnx-community/whisper-large-v3-turbo";

const TIPOS_DE_DATO: Record<VarianteWhisper, Record<string, "fp16" | "q4" | "q4f16">> = {
  fp16: { encoder_model: "fp16", decoder_model_merged: "q4f16" },
  q4: { encoder_model: "q4", decoder_model_merged: "q4" },
};

// Whisper admite hasta 224 tokens de prompt (la mitad de su contexto de 448): se guardan los
// últimos, que son los más cercanos a lo que se va a decir.
const MAXIMO_TOKENS_DE_PROMPT = 223;
const MAXIMO_TOKENS_NUEVOS = 180;

interface ModeloWhisper {
  generate(opciones: {
    inputs: Tensor;
    decoder_input_ids: number[];
    max_new_tokens: number;
  }): Promise<unknown>;
}

export interface Whisper {
  transcribir(audio: Float32Array, opciones: OpcionesTranscribir): Promise<string>;
}

export async function cargarWhisper(
  variante: VarianteWhisper,
  alAvanzar: (cargado: number, total: number) => void,
): Promise<Whisper> {
  // Los modelos se guardan en disco (ver cache-en-disco.ts): la segunda vez cargan sin internet.
  env.useCustomCache = true;
  env.customCache = crearCacheEnDisco("modelos-whisper");
  const progreso = (info: ProgressInfo) => {
    if (info.status === "progress_total") alAvanzar(info.loaded, info.total);
  };
  const [procesador, tokenizador, modelo] = await Promise.all([
    AutoProcessor.from_pretrained(MODELO),
    AutoTokenizer.from_pretrained(MODELO),
    WhisperForConditionalGeneration.from_pretrained(MODELO, {
      device: "webgpu",
      dtype: TIPOS_DE_DATO[variante],
      progress_callback: progreso,
    }),
  ]);
  const whisper = crearWhisper(procesador, tokenizador, modelo);
  // La primera pasada compila los shaders de WebGPU y tarda varios segundos: se hace ahora, no
  // con el primer subtítulo.
  await whisper.transcribir(new Float32Array(16_000), { prompt: "", idioma: "es" });
  return whisper;
}

function crearWhisper(
  procesador: (audio: Float32Array) => Promise<{ input_features: Tensor }>,
  tokenizador: PreTrainedTokenizer,
  modelo: ModeloWhisper,
): Whisper {
  const token = (texto: string) => tokenizador.convert_tokens_to_ids(texto);

  return {
    async transcribir(audio, { prompt, idioma }) {
      const { input_features } = await procesador(audio);
      const inicio = [
        token("<|startoftranscript|>"),
        token(`<|${idioma}|>`),
        token("<|transcribe|>"),
        token("<|notimestamps|>"),
      ];
      // Transformers.js todavía no aplica `prompt_ids`: el prompt va a mano, como lo hace
      // Whisper, con <|startofprev|> y el texto antes del comienzo de la transcripción.
      const guia =
        prompt.trim() === ""
          ? []
          : [
              token("<|startofprev|>"),
              ...tokenizador
                .encode(` ${prompt.trim()}`, { add_special_tokens: false })
                .slice(-MAXIMO_TOKENS_DE_PROMPT),
            ];
      const entrada = [...guia, ...inicio];
      const salida = await modelo.generate({
        inputs: input_features,
        decoder_input_ids: entrada,
        max_new_tokens: MAXIMO_TOKENS_NUEVOS,
      });
      const generados = tokensGenerados(salida).slice(entrada.length);
      return tokenizador.decode(generados, { skip_special_tokens: true }).trim();
    },
  };
}

function tokensGenerados(salida: unknown): number[] {
  if (!(salida instanceof Tensor)) {
    throw new Error("Whisper devolvió un resultado inesperado (se esperaba un tensor de tokens)");
  }
  const filas: unknown = salida.tolist();
  const primera: unknown = Array.isArray(filas) ? filas[0] : null;
  if (!Array.isArray(primera)) {
    throw new Error("Whisper devolvió un tensor de tokens vacío");
  }
  return primera.map((token: unknown) => Number(token));
}
