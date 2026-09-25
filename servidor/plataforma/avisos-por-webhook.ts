import type { Avisos } from "./avisos";

// Manda el texto al canal por su webhook. Discord acepta `content`; Slack y Google Chat, `text`: se
// mandan los dos campos y cada uno usa el suyo. Un canal que no responde no rompe nada: se devuelve
// false y quien llama lo cuenta (la dirección del webhook nunca se registra ni se devuelve).
export function crearAvisosPorWebhook(): Avisos {
  return {
    async enviar(direccion, texto) {
      try {
        const respuesta = await fetch(direccion, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: texto, text: texto }),
          signal: AbortSignal.timeout(5000),
        });
        return respuesta.ok;
      } catch {
        return false;
      }
    },
  };
}
