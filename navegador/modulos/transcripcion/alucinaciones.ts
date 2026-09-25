import type { Resultado } from "@compartido/contratos";
import { normalizar } from "./texto";
import type { OpcionesTranscripcion, Transcriptor } from "./tipos";

// Whisper aprendió con videos de YouTube y, en fragmentos difíciles (final de una toma, casi
// silencio), inventa sus cierres. Son frases que casi nunca se dicen en una charla.
const CIERRES_DE_YOUTUBE = [
  /gracias por (ver|mirar)/,
  /suscrib(ete|ite|anse)\b|olvides suscribirte/,
  /nos vemos en el (proximo|siguiente) video/,
  /amara\.org/,
  /subtitulos (realizados )?por/,
  /thanks? (you )?for watching/,
  /please subscribe|like and subscribe|subscribe to (my|our|the) channel/,
  /see you (in the )?next video/,
  /obrigad[oa] por assistir/,
  /inscreva-se/,
  /ate o proximo video/,
  /legendas pela comunidade/,
];

export function limpiarAlucinaciones(texto: string): { texto: string; alucino: boolean } {
  const oraciones = texto.split(/(?<=[.!?…])\s+/);
  const quedan = oraciones.filter(
    (oracion) => !CIERRES_DE_YOUTUBE.some((cierre) => cierre.test(normalizar(oracion))),
  );
  return { texto: quedan.join(" ").trim(), alucino: quedan.length < oraciones.length };
}

// Si borró algo, reintenta una sola vez sin el prompt: el contexto de texto a veces empuja a
// Whisper a "continuar el video". El reintento cuenta como un pedido más en los motores de nube.
export async function transcribirSinAlucinaciones(
  transcriptor: Transcriptor,
  audio: Float32Array,
  opciones: OpcionesTranscripcion,
): Promise<Resultado<{ texto: string; ms: number; reintento: boolean }>> {
  const primera = await transcriptor.transcribir(audio, opciones);
  if (!primera.ok) return primera;
  const limpia = limpiarAlucinaciones(primera.valor.texto);
  if (!limpia.alucino) return { ok: true, valor: { ...primera.valor, reintento: false } };

  const segunda = await transcriptor.transcribir(audio, { ...opciones, prompt: "" });
  if (!segunda.ok) return segunda;
  return {
    ok: true,
    valor: {
      texto: limpiarAlucinaciones(segunda.valor.texto).texto,
      ms: primera.valor.ms + segunda.valor.ms,
      reintento: true,
    },
  };
}
