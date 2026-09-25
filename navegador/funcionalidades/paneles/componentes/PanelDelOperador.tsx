import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { NOMBRES_DE_IDIOMA, type EstadoDeLaInstancia, type Sala } from "@compartido/contratos";
import { leerEstado, listarSalas, salir } from "@navegador/modulos/cliente-instancia";
import { MarcoDelPanel } from "@navegador/interfaz/marco-de-entrada";
import { Modal } from "@navegador/interfaz/sistema-diseno";
import { PanelEnCarga } from "./PanelEnCarga";

type Carga =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; salas: Sala[]; evento: EstadoDeLaInstancia["evento"] };

const plural = (cantidad: number) => `${String(cantidad)} ${cantidad === 1 ? "charla" : "charlas"}`;

const idiomasDe = (sala: Sala) =>
  [sala.idiomaOriginal, ...sala.idiomasDestino]
    .map((idioma) => NOMBRES_DE_IDIOMA[idioma])
    .join(" · ");

// /operador: las salas que le asignó el administrador a quien entró con un código, en tarjetas
// como el maquetado. Tocar una abre sus accesos: entrar en vivo, calendario y monitoreo.
export function PanelDelOperador() {
  const navegar = useNavigate();
  const [carga, setCarga] = useState<Carga>({ fase: "cargando" });
  const [abierta, setAbierta] = useState<Sala | null>(null);

  useEffect(() => {
    void Promise.all([listarSalas(), leerEstado()]).then(([salas, estado]) => {
      if (!salas.ok) setCarga({ fase: "error", motivo: salas.motivo });
      else
        setCarga({
          fase: "lista",
          salas: salas.valor,
          evento: estado.ok ? estado.valor.evento : null,
        });
    });
  }, []);

  if (carga.fase !== "lista") return <PanelEnCarga carga={carga} />;

  const { salas, evento } = carga;
  return (
    <MarcoDelPanel
      rotulo={["OPERADOR", "PANEL"]}
      acciones={
        evento && (
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase">
            {evento.logo && (
              <img
                src={evento.logo}
                alt=""
                className="size-6 border border-[#443d30]/40 object-cover"
              />
            )}
            {evento.nombre}
          </span>
        )
      }
      alSalir={() => void salir().then(() => navegar("/", { replace: true }))}
    >
      <div className="mb-10 shrink-0">
        <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
          Panel de operador
        </span>
        <h1 className="mt-2 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase md:text-6xl">
          Tus salas
        </h1>
      </div>

      {salas.length === 0 ? (
        <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center border-[1.5px] border-dashed border-[#443d30]/60 px-8 py-16 text-center">
          <span className="mb-6 font-mono text-5xl leading-none text-naranja">+</span>
          <h2 className="mb-3 font-display text-3xl leading-[0.95] uppercase md:text-4xl">
            Todavía no tenés
            <br />
            salas asignadas
          </h2>
          <p className="max-w-[440px] text-base text-ink/70">
            Cuando el administrador te asigne una sala, la vas a ver acá.
          </p>
        </div>
      ) : (
        <ul className="grid flex-1 grid-cols-1 content-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {salas.map((sala) => (
            <li key={sala.id} className="flex">
              <button
                type="button"
                onClick={() => setAbierta(sala)}
                className="flex w-full flex-col border-[1.5px] border-[#443d30] bg-canvas p-5 text-left transition-colors hover:border-ink"
              >
                <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
                  Sala
                </span>
                <h3 className="mt-1 font-display text-2xl leading-none uppercase">{sala.nombre}</h3>
                <p className="mt-2 font-mono text-[11px] text-ink/50">{idiomasDe(sala)}</p>
                <p className="mt-auto border-t border-[#443d30]/15 pt-4 text-xs text-ink/60">
                  {plural(sala.charlas)} en la agenda
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {abierta && (
        <Modal etiqueta="Sala" titulo={abierta.nombre} alCerrar={() => setAbierta(null)}>
          <p className="mb-6 font-mono text-xs text-ink/60">{idiomasDe(abierta)}</p>
          <div className="flex flex-col gap-3">
            <Link
              to={`/sala/${abierta.id}/control`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-[3px] border-[#b8241f] bg-naranja px-5 py-3 text-center font-mono text-xs font-bold tracking-widest uppercase transition-colors hover:bg-[#e67b00]"
            >
              Entrar en vivo →
            </Link>
            {[
              ["Calendario", `/sala/${abierta.id}/calendario`],
              ["Monitoreo", `/sala/${abierta.id}/monitoreo`],
            ].map(([nombre, ruta]) => (
              <Link
                key={nombre}
                to={ruta ?? ""}
                className="border-[1.5px] border-[#443d30] px-5 py-3 text-center font-mono text-xs font-bold tracking-widest uppercase transition-colors hover:border-ink"
              >
                {nombre}
              </Link>
            ))}
          </div>
        </Modal>
      )}
    </MarcoDelPanel>
  );
}
