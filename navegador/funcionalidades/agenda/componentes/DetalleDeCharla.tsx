import { useState } from "react";
import { Link } from "react-router";
import type { Charla, DatosDeCharla } from "@compartido/contratos";
import { Aviso } from "@navegador/interfaz/sistema-diseno";
import { aDatos } from "../datos-de-charla";
import { BloqueDeTranscripcion } from "./BloqueDeTranscripcion";
import { formatearMinutos, haTerminado, nombreDelDia } from "../fechas";
import { agregarTerminos, leerArchivoDeGlosario, sugerirTerminos } from "../glosario";

const subtitulo = "font-mono text-[11px] tracking-widest text-ink/50 uppercase";
const accion = "font-mono text-xs font-bold tracking-widest uppercase";

// El detalle de la charla elegida, con su glosario técnico: se escribe a mano, se carga de un
// archivo o se completa con los términos que sugiere el título y el resumen (nada entra sin aceptarlo).
export function DetalleDeCharla({
  charla,
  soloLectura,
  alEditar,
  alGuardarGlosario,
  alEliminar,
}: {
  charla: Charla;
  soloLectura: boolean;
  alEditar: () => void;
  // Devuelven el motivo si no se pudo (null si salió bien).
  alGuardarGlosario: (datos: DatosDeCharla) => Promise<string | null>;
  alEliminar: () => Promise<string | null>;
}) {
  // El borrador se reinicia al cambiar de charla (la `key` la pone quien lo usa).
  const [glosario, setGlosario] = useState(charla.glosario);
  const [sugeridos, setSugeridos] = useState<string[] | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "nota" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const sinGuardar = glosario !== charla.glosario;
  const terminada = haTerminado(charla.fecha, charla.finMin);

  const guardar = async (texto: string) => {
    setGuardando(true);
    const motivo = await alGuardarGlosario({ ...aDatos(charla), glosario: texto });
    setGuardando(false);
    setMensaje(
      motivo === null
        ? { tipo: "nota", texto: "Glosario guardado." }
        : { tipo: "error", texto: motivo },
    );
  };

  const leerArchivo = async (archivo: File | undefined) => {
    if (!archivo) return;
    const combinado = agregarTerminos(
      glosario,
      leerArchivoDeGlosario(archivo.name, await archivo.text()).split("\n"),
    );
    setGlosario(combinado);
    setMensaje({ tipo: "nota", texto: "Cargamos el archivo: revisá y guardá el glosario." });
  };

  const aceptar = (terminos: string[]) => {
    setGlosario(agregarTerminos(glosario, terminos));
    setSugeridos((actuales) => (actuales ?? []).filter((termino) => !terminos.includes(termino)));
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
          Detalle de actividad
        </span>
        <span
          className={`shrink-0 px-2 py-1 font-mono text-[9px] font-bold tracking-widest uppercase ${terminada ? "bg-verde/20 text-verde" : "bg-ink/10 text-ink/50"}`}
        >
          {terminada ? "Finalizada" : "Pendiente"}
        </span>
      </div>
      <h2 className="mt-1 mb-4 font-display text-3xl leading-[0.95] uppercase">{charla.titulo}</h2>
      <p className="mb-5 font-mono text-xs tracking-widest text-ink/60 uppercase">
        {nombreDelDia(charla.fecha)} · {formatearMinutos(charla.inicioMin)} –{" "}
        {formatearMinutos(charla.finMin)}
      </p>
      <Link
        to={`/sala/${charla.salaId}/control?charla=${charla.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 block border-[3px] border-[#b8241f] bg-naranja px-4 py-2.5 text-center font-mono text-xs font-bold tracking-widest uppercase transition-colors hover:bg-[#e67b00]"
      >
        {soloLectura ? "Ver en vivo esta charla →" : "Transcribir esta charla →"}
      </Link>
      {charla.oradores !== "" && (
        <p className="mb-3 font-mono text-xs text-ink/70">Con {charla.oradores}</p>
      )}
      <p className="mb-6 text-sm leading-relaxed text-ink/80">
        {charla.resumen === "" ? "Sin descripción." : charla.resumen}
      </p>

      <BloqueDeTranscripcion charlaId={charla.id} titulo={charla.titulo} />

      <section className="mb-8">
        <span className={subtitulo}>Glosario técnico</span>
        <p className="mt-2 mb-3 text-xs leading-relaxed text-ink/60">
          Términos específicos de esta actividad (nombres, marcas, jerga) para mejorar la precisión.
          Uno por renglón; con «~» las variantes que Whisper suele escribir mal y con «=&gt;» una
          traducción fija.
        </p>
        <textarea
          value={glosario}
          onChange={(evento) => setGlosario(evento.target.value)}
          rows={6}
          readOnly={soloLectura}
          aria-label="Glosario técnico de la actividad"
          className="mb-3 w-full border-[1.5px] border-[#443d30] bg-canvas px-3 py-2 font-mono text-sm outline-none focus:border-naranja"
        />
        {!soloLectura && (
          <>
            <label className="flex cursor-pointer items-center justify-center gap-2 border-[1.5px] border-dashed border-[#443d30]/60 px-4 py-2.5 transition-colors hover:border-ink">
              <input
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                onChange={(evento) => {
                  void leerArchivo(evento.target.files?.[0]);
                  evento.target.value = "";
                }}
              />
              <span className={`${accion} text-ink/60`}>+ Cargar archivo (.csv)</span>
            </label>
            <button
              type="button"
              onClick={() => setSugeridos(sugerirTerminos(charla.titulo, charla.resumen, glosario))}
              className={`${accion} mt-2 w-full border-[1.5px] border-[#443d30] px-4 py-2.5 text-ink/60 transition-colors hover:border-ink hover:text-ink`}
            >
              ✦ Sugerir términos
            </button>
            {sinGuardar && (
              <button
                type="button"
                disabled={guardando}
                onClick={() => void guardar(glosario)}
                className={`${accion} mt-2 w-full border-[3px] border-[#b8241f] bg-naranja px-4 py-2.5 transition-colors hover:bg-[#e67b00] disabled:opacity-40`}
              >
                Guardar glosario
              </button>
            )}
          </>
        )}
        {sugeridos !== null && (
          <div className="mt-3 flex flex-col gap-2">
            {sugeridos.length === 0 ? (
              <p className="text-[11px] leading-snug text-ink/50">
                No encontré términos nuevos en el título ni en la descripción. Si la charla tiene
                descripción, agregala con «Editar» y probá de nuevo.
              </p>
            ) : (
              <>
                <ul className="flex flex-wrap gap-1.5">
                  {sugeridos.map((termino) => (
                    <li
                      key={termino}
                      className="flex items-center gap-1.5 border-[1.5px] border-[#443d30] px-2 py-1 font-mono text-[11px]"
                    >
                      {termino}
                      <button
                        type="button"
                        title="Aceptar"
                        aria-label={`Aceptar ${termino}`}
                        onClick={() => aceptar([termino])}
                        className="font-bold text-[#1f6b56]"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        title="Descartar"
                        aria-label={`Descartar ${termino}`}
                        onClick={() => setSugeridos(sugeridos.filter((otro) => otro !== termino))}
                        className="text-ink/40 hover:text-[#b8241f]"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => aceptar(sugeridos)}
                  className="self-start font-mono text-[11px] font-bold tracking-widest text-naranja uppercase hover:underline"
                >
                  Aceptar todos
                </button>
                <p className="text-[11px] leading-snug text-ink/50">
                  Sugeridos a partir del título y la descripción. Revisalos: nada entra al glosario
                  sin aceptarlo.
                </p>
              </>
            )}
          </div>
        )}
        {sinGuardar && (
          <p className="mt-2 font-mono text-[11px] text-naranja">Hay cambios sin guardar.</p>
        )}
        {mensaje && (
          <div className="mt-2">
            <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>
          </div>
        )}
      </section>

      {!soloLectura && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={alEditar}
            className={`${accion} text-ink/60 transition-colors hover:text-ink`}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`¿Eliminar «${charla.titulo}»? No se puede deshacer.`)) {
                void alEliminar().then((motivo) => {
                  if (motivo !== null) setMensaje({ tipo: "error", texto: motivo });
                });
              }
            }}
            className={`${accion} text-[#b8241f] hover:underline`}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
