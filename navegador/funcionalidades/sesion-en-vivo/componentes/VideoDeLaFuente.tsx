import { useEffect, useRef } from "react";

// El video de un link mientras se transcribe. El elemento ya existe (lo creó la captura y su audio
// va al procesador, no a los parlantes): acá solo se lo pone a la vista.
export function VideoDeLaFuente({ video }: { video: HTMLVideoElement }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const destino = contenedor.current;
    if (!destino) return;
    video.className = "aspect-video w-full bg-escenario";
    destino.replaceChildren(video);
    return () => destino.replaceChildren();
  }, [video]);

  return (
    <div className="border-[1.5px] border-ink/15 bg-canvas p-5">
      <h2 className="mb-3 font-mono text-[10px] font-bold tracking-widest text-ink/55 uppercase">
        Video de la fuente
      </h2>
      <div ref={contenedor} />
    </div>
  );
}
