import { useEffect, useRef, useState } from "react";
import type { Idioma, Linea } from "@compartido/contratos";
import { sugerirTermino } from "../correccion";
import { NOMBRES_DE_IDIOMA } from "./ControlSesion";

export interface PropiedadesTranscripcion {
  lineas: readonly Linea[];
  idiomasDestino: readonly Idioma[];
  // Sin esto la transcripción solo se lee.
  alCorregir?: (id: string, original: string, traducciones: Linea["traducciones"]) => void;
  // Agrega una entrada al glosario (sesión en curso y charla) para que las próximas frases salgan
  // bien. Devuelve el motivo si no se pudo (null si salió bien).
  alRecordar?: (entrada: string) => Promise<string | null>;
}

const formatearTiempo = (segundos: number) => {
  const minutos = Math.floor(segundos / 60);
  return `${String(minutos).padStart(2, "0")}:${(segundos % 60).toFixed(1).padStart(4, "0")}`;
};

interface Borrador {
  original: string;
  traducciones: Linea["traducciones"];
}

const campo =
  "w-full border-[1.5px] border-ink/25 bg-canvas px-2 py-1.5 text-sm outline-none focus:border-naranja";
const accion = "font-mono text-[10px] font-bold tracking-widest uppercase";

// La transcripción de la sesión. Cada frase confirmada se puede corregir a mano (el texto o su
// traducción): el cambio le llega enseguida a quien mira, queda guardado en la charla y, si fue una
// palabra o un término, se ofrece recordarlo en el glosario para las frases que siguen.
export function Transcripcion({
  lineas,
  idiomasDestino,
  alCorregir,
  alRecordar,
}: PropiedadesTranscripcion) {
  const final = useRef<HTMLLIElement>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [corregidas, setCorregidas] = useState<ReadonlySet<string>>(new Set());
  const [sugerencia, setSugerencia] = useState<{ id: string; entrada: string } | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const conTexto = lineas.filter((linea) => linea.original.trim() !== "");

  // La vista baja sola con lo nuevo, salvo mientras se está corrigiendo una frase.
  useEffect(() => {
    if (editando === null) final.current?.scrollIntoView({ block: "nearest" });
  }, [conTexto.length, editando]);

  if (conTexto.length === 0) {
    return (
      <p className="font-mono text-sm text-ink/50">
        La transcripción aparece acá cuando empieza la sesión.
      </p>
    );
  }

  const empezar = (linea: Linea) => {
    setEditando(linea.id);
    setBorrador({ original: linea.original, traducciones: { ...linea.traducciones } });
    setSugerencia(null);
    setMensaje(null);
  };

  const guardar = (linea: Linea) => {
    if (!borrador || !alCorregir) return;
    const texto = borrador.original.trim();
    if (texto === "") return;
    alCorregir(linea.id, texto, borrador.traducciones);
    setCorregidas((anteriores) => new Set(anteriores).add(linea.id));
    const entrada = sugerirTermino(linea.original, texto);
    setSugerencia(entrada ? { id: linea.id, entrada } : null);
    setEditando(null);
    setBorrador(null);
  };

  const recordar = async (entrada: string) => {
    const motivo = (await alRecordar?.(entrada)) ?? null;
    setSugerencia(null);
    setMensaje(motivo ?? `Listo: «${entrada}» vale desde la próxima frase.`);
  };

  return (
    <div className="flex flex-col gap-2">
      {mensaje !== null && (
        <p
          role="status"
          className="border-l-4 border-verde bg-verde/10 px-3 py-1.5 font-mono text-xs"
        >
          {mensaje}
        </p>
      )}
      <ol className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto pr-2">
        {conTexto.map((linea) => (
          <li
            key={linea.id}
            className="grid grid-cols-[4.5rem_1fr] gap-3 border-b border-linea pb-3"
          >
            <span className="pt-0.5 font-mono text-[11px] text-ink/45">
              {formatearTiempo(linea.inicio)}
            </span>
            {editando === linea.id && borrador ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={borrador.original}
                  rows={2}
                  aria-label="Texto de la frase"
                  onChange={(evento) => setBorrador({ ...borrador, original: evento.target.value })}
                  className={campo}
                />
                {idiomasDestino.map((idioma) => (
                  <label key={idioma} className="flex items-start gap-2 text-sm">
                    <span className="pt-1.5 font-mono text-[10px] font-bold text-naranja uppercase">
                      {NOMBRES_DE_IDIOMA[idioma].slice(0, 2)}
                    </span>
                    <textarea
                      value={borrador.traducciones[idioma] ?? ""}
                      rows={2}
                      aria-label={`Traducción al ${NOMBRES_DE_IDIOMA[idioma]}`}
                      onChange={(evento) =>
                        setBorrador({
                          ...borrador,
                          traducciones: { ...borrador.traducciones, [idioma]: evento.target.value },
                        })
                      }
                      className={campo}
                    />
                  </label>
                ))}
                <p className="font-mono text-[11px] text-ink/55">
                  Si cambiás el texto, las traducciones que no toques se rehacen solas.
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => guardar(linea)}
                    className={`${accion} text-naranja hover:underline`}
                  >
                    Guardar corrección
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(null);
                      setBorrador(null);
                    }}
                    className={`${accion} text-ink/60 hover:text-ink`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <p className={linea.provisoria ? "text-ink/40 italic" : "text-ink"}>
                  {linea.original}
                </p>
                {idiomasDestino.map((idioma) => (
                  <p key={idioma} className="text-sm text-ink/70">
                    <span className="mr-2 font-mono text-[10px] font-bold text-naranja uppercase">
                      {NOMBRES_DE_IDIOMA[idioma].slice(0, 2)}
                    </span>
                    {linea.provisoria ? "…" : (linea.traducciones[idioma] ?? "…")}
                  </p>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  {!linea.provisoria && alCorregir && (
                    <button
                      type="button"
                      onClick={() => empezar(linea)}
                      className={`${accion} text-ink/50 hover:text-ink`}
                    >
                      ✎ Editar
                    </button>
                  )}
                  {corregidas.has(linea.id) && (
                    <span className="font-mono text-[10px] text-verde">Corregida a mano</span>
                  )}
                </div>
                {sugerencia?.id === linea.id && (
                  <div className="mt-1 flex flex-wrap items-center gap-3 border-l-4 border-naranja bg-naranja/10 px-3 py-1.5 font-mono text-xs">
                    <span>
                      ¿Recordar <strong>{sugerencia.entrada}</strong> en el glosario para las
                      próximas frases?
                    </span>
                    <button
                      type="button"
                      onClick={() => void recordar(sugerencia.entrada)}
                      className={`${accion} text-naranja hover:underline`}
                    >
                      Sí, agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSugerencia(null)}
                      className={`${accion} text-ink/60 hover:text-ink`}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
        <li ref={final} aria-hidden />
      </ol>
    </div>
  );
}
