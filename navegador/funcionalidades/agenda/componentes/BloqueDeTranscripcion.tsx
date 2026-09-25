import { useEffect, useState } from "react";
import { NOMBRES_DE_IDIOMA, type Idioma, type Transcripcion } from "@compartido/contratos";
import { Boton, Campo } from "@navegador/interfaz/sistema-diseno";
import { leerTranscripcion } from "@navegador/modulos/cliente-instancia";
import { exportar, idiomasDisponibles, segmentosEn, type Formato } from "../transcripcion";

const EXTENSION: Record<Formato, { extension: string; tipo: string }> = {
  txt: { extension: "txt", tipo: "text/plain;charset=utf-8" },
  srt: { extension: "srt", tipo: "application/x-subrip;charset=utf-8" },
  vtt: { extension: "vtt", tipo: "text/vtt;charset=utf-8" },
};

const subtitulo = "font-mono text-[10px] font-bold tracking-widest text-ink/60 uppercase";

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

  return (
    <div className="flex flex-col gap-3">
      <h3 className={subtitulo}>Transcripción</h3>
      <label className="flex flex-col gap-1.5">
        <span className={subtitulo}>Idioma</span>
        <select
          value={idioma}
          onChange={(evento) => setIdioma(evento.target.value as "original" | Idioma)}
          className="border-[1.5px] border-ink/25 bg-canvas px-3 py-2 font-mono text-sm"
        >
          <option value="original">Original</option>
          {idiomasDisponibles(segmentos).map((disponible) => (
            <option key={disponible} value={disponible}>
              {NOMBRES_DE_IDIOMA[disponible]}
            </option>
          ))}
        </select>
      </label>
      <pre className="max-h-[180px] overflow-y-auto border-[1.5px] border-ink/20 bg-canvas p-3 font-mono text-xs whitespace-pre-wrap">
        {texto}
      </pre>
      <Campo
        etiqueta="Correr el tiempo (segundos)"
        tipo="number"
        valor={corrimiento}
        alCambiar={setCorrimiento}
        ayuda="Para que coincida con el video; negativo adelanta. Vale para SRT y VTT."
      />
      <div className="flex flex-wrap gap-3">
        <Boton variante="secundario" onClick={() => void copiar()}>
          {copiado ? "✓ Copiado" : "Copiar"}
        </Boton>
        {(["txt", "srt", "vtt"] as const).map((formato) => (
          <Boton key={formato} variante="secundario" onClick={() => descargar(formato)}>
            Descargar (.{formato})
          </Boton>
        ))}
      </div>
    </div>
  );
}
