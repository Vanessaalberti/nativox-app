import { useEffect, useRef } from "react";
import type { Idioma, Linea } from "@compartido/contratos";
import { NOMBRES_DE_IDIOMA } from "./ControlSesion";

export interface PropiedadesTranscripcion {
  lineas: readonly Linea[];
  idiomasDestino: readonly Idioma[];
}

const formatearTiempo = (segundos: number) => {
  const minutos = Math.floor(segundos / 60);
  return `${String(minutos).padStart(2, "0")}:${(segundos % 60).toFixed(1).padStart(4, "0")}`;
};

export function Transcripcion({ lineas, idiomasDestino }: PropiedadesTranscripcion) {
  const final = useRef<HTMLLIElement>(null);
  const conTexto = lineas.filter((linea) => linea.original.trim() !== "");

  useEffect(() => {
    final.current?.scrollIntoView({ block: "nearest" });
  }, [conTexto.length]);

  if (conTexto.length === 0) {
    return (
      <p className="font-mono text-sm text-ink/50">
        La transcripción aparece acá cuando empieza la sesión.
      </p>
    );
  }
  return (
    <ol className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto pr-2">
      {conTexto.map((linea) => (
        <li key={linea.id} className="grid grid-cols-[4.5rem_1fr] gap-3 border-b border-linea pb-3">
          <span className="pt-0.5 font-mono text-[11px] text-ink/45">
            {formatearTiempo(linea.inicio)}
          </span>
          <div className="flex flex-col gap-1">
            <p className={linea.provisoria ? "text-ink/40 italic" : "text-ink"}>{linea.original}</p>
            {idiomasDestino.map((idioma) => (
              <p key={idioma} className="text-sm text-ink/70">
                <span className="mr-2 font-mono text-[10px] font-bold uppercase text-naranja">
                  {NOMBRES_DE_IDIOMA[idioma].slice(0, 2)}
                </span>
                {linea.provisoria ? "…" : (linea.traducciones[idioma] ?? "…")}
              </p>
            ))}
          </div>
        </li>
      ))}
      <li ref={final} aria-hidden />
    </ol>
  );
}
