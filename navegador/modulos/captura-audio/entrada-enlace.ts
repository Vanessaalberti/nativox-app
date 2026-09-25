import type { Resultado } from "@compartido/contratos";
import { crearNodoDeCaptura } from "./nodo-de-captura";
import type { Captura, OpcionesCaptura } from "./tipos";

const MOTIVO_DE_LA_FALLA =
  "No se pudo reproducir ese link. Tiene que ser un video o audio directo (.mp4, .webm, .mp3…) de un sitio que permita usarlo desde otra página. Con YouTube y similares, abrí el video en otra pestaña y usá «Pestaña o ventana».";

// Un video o audio por su dirección, entregado en tiempo real y sin sonar (el audio va al
// procesador, no a los parlantes). Devuelve también el elemento de video para mostrarlo.
export async function abrirEnlace(
  direccion: string,
  { alRecibir, alTerminar }: OpcionesCaptura,
): Promise<Resultado<Captura & { video: HTMLVideoElement }>> {
  let url: URL;
  try {
    url = new URL(direccion);
  } catch {
    return { ok: false, motivo: "Ese link no es una dirección válida." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, motivo: "El link tiene que empezar con https://." };
  }

  const video = document.createElement("video");
  // Sin este permiso el navegador entrega silencio al procesador en vez de fallar.
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.controls = true;
  video.src = url.href;

  try {
    await new Promise<void>((resolver, rechazar) => {
      video.addEventListener("canplay", () => resolver(), { once: true });
      video.addEventListener("error", () => rechazar(new Error("no carga")), { once: true });
    });
  } catch {
    return { ok: false, motivo: MOTIVO_DE_LA_FALLA };
  }

  const { contexto, nodo, cerrar } = await crearNodoDeCaptura(alRecibir);
  contexto.createMediaElementSource(video).connect(nodo);
  video.addEventListener("ended", () => alTerminar("Terminó el video."));
  video.addEventListener("error", () => alTerminar("Se cortó el video."));
  try {
    await video.play();
  } catch {
    cerrar();
    return { ok: false, motivo: MOTIVO_DE_LA_FALLA };
  }

  return {
    ok: true,
    valor: {
      video,
      detener: () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
        cerrar();
      },
    },
  };
}
