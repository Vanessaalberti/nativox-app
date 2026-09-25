import type { Resultado } from "@compartido/contratos";
import { abrirDesdeFlujo } from "./nodo-de-captura";
import type { Captura, OpcionesCaptura } from "./tipos";

// El audio de otra pestaña o ventana (un video de YouTube, una transmisión abierta en el navegador,
// una llamada). El navegador pide elegir qué compartir y hay que tildar "compartir audio": el
// video que llega junto con el audio se descarta.
export async function abrirPestana(opciones: OpcionesCaptura): Promise<Resultado<Captura>> {
  let flujo: MediaStream;
  try {
    flujo = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
  } catch {
    return {
      ok: false,
      motivo: "No se eligió ninguna pestaña o el navegador no dio permiso para compartirla.",
    };
  }
  for (const pista of flujo.getVideoTracks()) pista.stop();
  if (flujo.getAudioTracks().length === 0) {
    for (const pista of flujo.getTracks()) pista.stop();
    return {
      ok: false,
      motivo:
        "Esa pestaña no compartió audio. Al elegirla, tildá «Compartir audio de la pestaña» (en Chrome y Edge; Firefox y Safari no lo permiten).",
    };
  }
  return {
    ok: true,
    valor: await abrirDesdeFlujo(flujo, opciones, "Se dejó de compartir la pestaña."),
  };
}
