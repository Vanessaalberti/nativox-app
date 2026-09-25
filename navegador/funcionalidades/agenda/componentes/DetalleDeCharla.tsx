import { useState } from "react";
import type { Charla, DatosDeCharla } from "@compartido/contratos";
import { Aviso, Boton } from "@navegador/interfaz/sistema-diseno";
import { aDatos } from "../datos-de-charla";
import { formatearMinutos, nombreDelDia } from "../fechas";
import { agregarTerminos, leerArchivoDeGlosario, sugerirTerminos } from "../glosario";

const subtitulo = "font-mono text-[10px] font-bold tracking-widest text-ink/60 uppercase";

// El detalle de la charla elegida, con su glosario técnico: se escribe a mano, se carga de un
// archivo o se completa con los términos que sugiere el título y el resumen (nada entra sin aceptarlo).
export function DetalleDeCharla({
  charla,
  alEditar,
  alGuardarGlosario,
}: {
  charla: Charla;
  alEditar: () => void;
  // Devuelve el motivo si no se pudo guardar (null si salió bien).
  alGuardarGlosario: (datos: DatosDeCharla) => Promise<string | null>;
}) {
  // El borrador se reinicia al cambiar de charla (la `key` la pone quien lo usa).
  const [glosario, setGlosario] = useState(charla.glosario);
  const [sugeridos, setSugeridos] = useState<string[] | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "nota" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const sinGuardar = glosario !== charla.glosario;

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
    <aside className="flex flex-col gap-5 border-[1.5px] border-ink/25 bg-canvas p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={subtitulo}>Detalle de actividad</span>
          <h2 className="mt-1 font-display text-3xl leading-none uppercase">{charla.titulo}</h2>
          <p className="mt-1 font-mono text-xs text-ink/70">
            {nombreDelDia(charla.fecha)} · {formatearMinutos(charla.inicioMin)} –{" "}
            {formatearMinutos(charla.finMin)}
          </p>
        </div>
        <Boton variante="secundario" onClick={alEditar}>
          Editar
        </Boton>
      </div>

      {charla.oradores !== "" && (
        <p className="font-mono text-xs">
          <span className={subtitulo}>Oradores</span>
          <br />
          {charla.oradores}
        </p>
      )}
      <p className="text-sm text-ink/80">
        {charla.resumen === "" ? "Sin descripción." : charla.resumen}
      </p>

      <section className="flex flex-col gap-3">
        <h3 className={subtitulo}>Glosario técnico</h3>
        <p className="font-mono text-[11px] text-ink/60">
          Términos específicos de esta actividad (nombres, marcas, jerga) para mejorar la precisión.
          Uno por renglón; con «~» las variantes que Whisper suele escribir mal y con «=&gt;» una
          traducción fija.
        </p>
        <textarea
          value={glosario}
          onChange={(evento) => setGlosario(evento.target.value)}
          rows={6}
          aria-label="Glosario técnico de la actividad"
          className="w-full border-[1.5px] border-ink/25 bg-canvas px-3 py-2 font-mono text-sm outline-none focus:border-naranja"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Boton disabled={guardando || !sinGuardar} onClick={() => void guardar(glosario)}>
            Guardar glosario
          </Boton>
          <label className="cursor-pointer font-mono text-[11px] font-bold tracking-widest uppercase underline hover:text-naranja">
            + Cargar archivo (.csv o .txt)
            <input
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="sr-only"
              onChange={(evento) => {
                void leerArchivo(evento.target.files?.[0]);
                evento.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => setSugeridos(sugerirTerminos(charla.titulo, charla.resumen, glosario))}
            className="font-mono text-[11px] font-bold tracking-widest uppercase underline hover:text-naranja"
          >
            ✦ Sugerir términos
          </button>
        </div>
        {sinGuardar && (
          <p className="font-mono text-[11px] text-naranja">Hay cambios sin guardar.</p>
        )}
        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

        {sugeridos !== null && (
          <div className="flex flex-col gap-2">
            {sugeridos.length === 0 ? (
              <p className="font-mono text-[11px] text-ink/60">
                No encontré términos nuevos en el título ni en el resumen. Si la charla tiene
                resumen, agregalo con «Editar» y probá de nuevo.
              </p>
            ) : (
              <>
                <p className="font-mono text-[11px] text-ink/60">
                  Sugeridos a partir del título y el resumen. Revisalos: nada entra al glosario sin
                  aceptarlo.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {sugeridos.map((termino) => (
                    <li
                      key={termino}
                      className="flex items-center gap-1.5 border-[1.5px] border-ink/30 px-2 py-1 font-mono text-[11px]"
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
                  className="self-start font-mono text-[11px] font-bold tracking-widest uppercase underline"
                >
                  Aceptar todos
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
