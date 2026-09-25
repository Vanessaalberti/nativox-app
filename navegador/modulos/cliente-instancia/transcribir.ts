import {
  esquemaTranscripcionNube,
  type Idioma,
  type Resultado,
  type TranscripcionNube,
} from "@compartido/contratos";
import { llamar } from "./llamar";

const ESPERA_REINTENTO_MS = 2000;

const enviar = (wav: Uint8Array<ArrayBuffer>, idioma: Idioma, prompt: string) =>
  llamar(`/api/transcribir?idioma=${idioma}`, esquemaTranscripcionNube, {
    metodo: "POST",
    audio: {
      tipo: "audio/wav",
      datos: wav,
      // En un encabezado y no en la URL: es lo que se viene diciendo, no tiene que quedar en los
      // registros.
      encabezados: { "X-Nativox-Prompt": encodeURIComponent(prompt) },
    },
  });

// Una frase (WAV de 16 kHz) a Whisper en Workers AI. Si falla se reintenta una vez a los 2 s:
// perder una frase en vivo se nota, y un pedido que falla no gasta cuota.
export async function transcribirEnLaNube(
  wav: Uint8Array<ArrayBuffer>,
  idioma: Idioma,
  prompt: string,
): Promise<Resultado<TranscripcionNube>> {
  const primera = await enviar(wav, idioma, prompt);
  if (primera.ok) return primera;
  await new Promise((seguir) => setTimeout(seguir, ESPERA_REINTENTO_MS));
  return enviar(wav, idioma, prompt);
}
