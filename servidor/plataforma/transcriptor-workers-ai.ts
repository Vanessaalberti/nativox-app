import type { Transcriptor } from "./transcriptor";

// Whisper large-v3 turbo en Workers AI: reconoce por frases y devuelve el horario de cada palabra.
export function crearTranscriptorWorkersAi(ai: Env["AI"]): Transcriptor {
  return {
    async transcribir({ audio, idioma, prompt }) {
      const salida = await ai.run("@cf/openai/whisper-large-v3-turbo", {
        audio: btoa(Array.from(audio, (byte) => String.fromCharCode(byte)).join("")),
        task: "transcribe",
        language: idioma,
        vad_filter: true,
        ...(prompt !== "" && { initial_prompt: prompt }),
      });
      return {
        texto: salida.text.trim(),
        // El horario de cada palabra: el navegador lo usa para sacar el audio de contexto.
        palabras: (salida.segments ?? []).flatMap((segmento) =>
          (segmento.words ?? []).flatMap(({ word, start, end }) =>
            word !== undefined && start !== undefined && end !== undefined
              ? [{ palabra: word, inicio: start, fin: end }]
              : [],
          ),
        ),
      };
    },
  };
}
