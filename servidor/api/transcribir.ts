import * as v from "valibot";
import {
  SEGUNDOS_MAXIMOS_POR_PEDIDO,
  esquemaIdioma,
  type TranscripcionNube,
} from "@compartido/contratos";
import { validarWav } from "@servidor/modulos/audio-wav";
import { responderError } from "@servidor/plataforma/errores";
import { registrarError } from "@servidor/plataforma/registrar";
import { comoPersona, type ContextoApi } from "./sesion";

const LARGO_MAXIMO_PROMPT = 800;

// El prompt viaja en un encabezado (codificado) y no en la URL, para que no quede en los registros.
function leerPrompt(pedido: Request): string {
  const crudo = pedido.headers.get("X-Nativox-Prompt");
  if (!crudo) return "";
  try {
    return decodeURIComponent(crudo).slice(0, LARGO_MAXIMO_PROMPT);
  } catch {
    return "";
  }
}

// POST /api/transcribir?idioma=es — una frase en WAV (16 kHz, mono, de hasta 10 s), transcripta con
// Whisper en Workers AI. Solo con sesión (administrador u operador) y solo si el administrador
// activó la transcripción en la nube: consume la cuota de Workers AI de su cuenta.
export function transcribir(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoPersona(pedido, contexto, async () => {
    const evento = await contexto.almacen.leerEvento();
    if (!evento?.nubeComoRespaldo) {
      return responderError(
        403,
        "nube_desactivada",
        "La transcripción en la nube está apagada: el administrador la activa en Ajustes → Consumo.",
      );
    }
    const idioma = v.safeParse(esquemaIdioma, new URL(pedido.url).searchParams.get("idioma"));
    if (!idioma.success) {
      return responderError(400, "pedido_invalido", "Falta el idioma (es, en o pt).");
    }
    const audio = new Uint8Array(await pedido.arrayBuffer());
    const medido = validarWav(audio, SEGUNDOS_MAXIMOS_POR_PEDIDO);
    if (!medido.ok) return responderError(400, "audio_invalido", medido.motivo);

    try {
      const salida = await contexto.transcriptor.transcribir({
        audio,
        idioma: idioma.output,
        prompt: leerPrompt(pedido),
      });
      const cuerpo: TranscripcionNube = { ok: true, ...salida };
      return Response.json(cuerpo);
    } catch (causa) {
      registrarError("Falló Whisper en Workers AI", causa);
      return responderError(
        502,
        "fallo_del_modelo",
        "La transcripción en la nube no respondió. Probá de nuevo en un rato.",
      );
    }
  });
}
