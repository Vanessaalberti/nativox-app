import * as v from "valibot";

// La transcripción en la nube (Whisper en Workers AI): el navegador manda una frase en WAV y
// recibe el texto y el horario de cada palabra, con el que saca el audio de contexto.
export const esquemaTranscripcionNube = v.object({
  ok: v.literal(true),
  texto: v.string(),
  palabras: v.array(v.object({ palabra: v.string(), inicio: v.number(), fin: v.number() })),
});

export type TranscripcionNube = v.InferOutput<typeof esquemaTranscripcionNube>;

// Las frases van de 4 a 8 s (el máximo del cortador) más 1,5 s de contexto del fragmento anterior:
// un pedido más largo que esto no es una frase de la sesión en vivo.
export const SEGUNDOS_MAXIMOS_POR_PEDIDO = 10;
