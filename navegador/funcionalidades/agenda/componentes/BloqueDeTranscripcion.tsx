import { useEffect, useState } from "react";
import { NOMBRES_DE_IDIOMA, type Idioma, type Transcripcion } from "@compartido/contratos";
import { leerTranscripcion } from "@navegador/modulos/cliente-instancia";
import { exportar, idiomasDisponibles, segmentosEn, type Formato } from "../transcripcion";

const EXTENSION: Record<Formato, { extension: string; tipo: string }> = {
  txt: { extension: "txt", tipo: "text/plain;charset=utf-8" },
  srt: { extension: "srt", tipo: "application/x-subrip;charset=utf-8" },
  vtt: { extension: "vtt", tipo: "text/vtt;charset=utf-8" },
};

const subtitulo = "font-mono text-[11px] tracking-widest text-ink/50 uppercase";

// Lo que se transcribió de la charla (lo guarda la sala frase por frase), para copiar o descargar
// como texto, SRT o VTT, con un corrimiento de tiempo para que coincida con el video.
export function BloqueDeTranscripcion({ charlaId, titulo }: { charlaId: string; titulo: string }) {
  const [segmentos, setSegmentos] = useState<Transcripcion["segmentos"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idioma, setIdioma] = useState<"original" | Idioma>("original");
  const [corrimiento, setCorrimiento] = useState("0");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    void leerTranscripcion(charlaId).then((respuesta) => {
      if (respuesta.ok) setSegmentos(respuesta.valor);
      else setError(respuesta.motivo);
    });
  }, [charlaId]);

  if (error !== null) return <p className="font-mono text-xs text-[#b8241f]">{error}</p>;
  if (segmentos === null)
    return <p className="font-mono text-xs text-ink/60">Cargando la transcripción…</p>;
  if (segmentos.length === 0) {
    return (
      <p className="font-mono text-[11px] text-ink/60">
        Todavía no hay transcripción: se guarda sola cuando la sala transcribe esta charla.
      </p>
    );
  }

  const elegidos = segmentosEn(segmentos, idioma);
  const segundos = Number(corrimiento.replace(",", ".")) || 0;
  const texto = exportar(elegidos, "txt", segundos);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("El navegador no dejó copiar: descargá el archivo.");
    }
  };

  const descargar = (formato: Formato) => {
    const { extension, tipo } = EXTENSION[formato];
    const url = URL.createObjectURL(
      new Blob([exportar(elegidos, formato, segundos)], { type: tipo }),
    );
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-transcripcion.${extension}`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const enlace = "font-mono text-xs font-bold tracking-widest uppercase";

  return (
    <div className="mb-6">
      <span className={subtitulo}>Transcripción</span>
      <select
        value={idioma}
        aria-label="Idioma de la transcripción"
        onChange={(evento) => setIdioma(evento.target.value as "original" | Idioma)}
        className="mt-2 block w-full border-[1.5px] border-[#443d30] bg-canvas px-3 py-2 font-mono text-xs"
      >
        <option value="original">Original</option>
        {idiomasDisponibles(segmentos).map((disponible) => (
          <option key={disponible} value={disponible}>
            {NOMBRES_DE_IDIOMA[disponible]}
          </option>
        ))}
      </select>
      <div className="mt-2 mb-3 max-h-[120px] overflow-y-auto border-[1.5px] border-[#443d30]/25 p-3 text-xs leading-relaxed whitespace-pre-wrap text-ink/70">
        {texto}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void copiar()}
          className={`${enlace} text-ink/60 transition-colors hover:text-ink`}
        >
          {copiado ? "✓ Copiado" : "Copiar"}
        </button>
        {(["txt", "srt", "vtt"] as const).map((formato) => (
          <button
            key={formato}
            type="button"
            onClick={() => descargar(formato)}
            className={`${enlace} text-naranja hover:underline`}
          >
            Descargar (.{formato})
          </button>
        ))}
      </div>
      <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/60">
        Correr el tiempo
        <input
          type="number"
          step="0.5"
          value={corrimiento}
          onChange={(evento) => setCorrimiento(evento.target.value)}
          className="w-20 border-[1.5px] border-[#443d30] bg-canvas px-2 py-1 font-mono text-xs text-ink outline-none focus:border-naranja"
        />
        s <span className="text-ink/40">(para que coincida con el video; negativo adelanta)</span>
      </label>
    </div>
  );
}
