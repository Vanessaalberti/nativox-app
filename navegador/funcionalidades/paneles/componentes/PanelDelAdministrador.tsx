import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { EventoCompleto } from "@compartido/contratos";
import { leerEnlaceDeAudiencia, leerEvento, salir } from "@navegador/modulos/cliente-instancia";
import { MarcoDelPanel } from "@navegador/interfaz/marco-de-entrada";
import { PanelEnCarga } from "./PanelEnCarga";

type Carga =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; evento: EventoCompleto; email: string };

export type PestanaDelPanel = "dashboard" | "salas" | "staff" | "produccion" | "ajustes";

export interface DatosDelPanel {
  evento: EventoCompleto;
  email: string;
  // Si la pestaña está a la vista: las que ya se abrieron quedan armadas pero ocultas.
  visible: boolean;
  irA: (pestana: PestanaDelPanel) => void;
}

const PESTANAS: { id: PestanaDelPanel; nombre: string; acento: string; soloConEquipo?: true }[] = [
  { id: "dashboard", nombre: "Dashboard", acento: "border-naranja" },
  { id: "salas", nombre: "Salas", acento: "border-naranja" },
  // Solo con roles separados hay un equipo al que invitar.
  { id: "staff", nombre: "Staff", acento: "border-verde", soloConEquipo: true },
  { id: "produccion", nombre: "Producción", acento: "border-naranja" },
  { id: "ajustes", nombre: "Ajustes", acento: "border-naranja" },
];

// Los links viejos (/panel/operadores…) siguen abriendo la pestaña que corresponde.
export function pestanaDeLaRuta(segmento: string | undefined): PestanaDelPanel {
  const buscada = segmento === "operadores" ? "staff" : segmento;
  return PESTANAS.find((pestana) => pestana.id === buscada)?.id ?? "dashboard";
}

// El panel del administrador entero en una sola página: cambiar de pestaña no cambia de ruta ni
// vuelve a pedir el evento. Cada pestaña se arma la primera vez que se abre y después solo se
// oculta, así volver a ella es instantáneo.
export function PanelDelAdministrador({
  inicial,
  paneles,
}: {
  inicial: PestanaDelPanel;
  paneles: Record<PestanaDelPanel, (datos: DatosDelPanel) => ReactNode>;
}) {
  const navegar = useNavigate();
  const [carga, setCarga] = useState<Carga>({ fase: "cargando" });
  const [enlaceDeAudiencia, setEnlaceDeAudiencia] = useState<string | null>(null);
  const [activa, setActiva] = useState(inicial);
  const [abiertas, setAbiertas] = useState<PestanaDelPanel[]>([inicial]);

  useEffect(() => {
    void leerEvento().then((respuesta) => {
      setCarga(
        respuesta.ok
          ? { fase: "lista", ...respuesta.valor }
          : { fase: "error", motivo: respuesta.motivo },
      );
    });
  }, []);

  const conEvento = carga.fase === "lista";
  const solo = conEvento && carga.evento.tipo === "todo-en-uno";
  useEffect(() => {
    if (!solo) return;
    void leerEnlaceDeAudiencia().then((respuesta) => {
      if (respuesta.ok) setEnlaceDeAudiencia(`/a/${respuesta.valor}`);
    });
  }, [solo]);

  if (carga.fase !== "lista") return <PanelEnCarga carga={carga} />;

  const { evento, email } = carga;
  const cambiar = (pestana: PestanaDelPanel) => {
    setActiva(pestana);
    setAbiertas((anteriores) =>
      anteriores.includes(pestana) ? anteriores : [...anteriores, pestana],
    );
    window.history.replaceState(null, "", pestana === "dashboard" ? "/panel" : `/panel/${pestana}`);
  };

  return (
    <MarcoDelPanel
      acciones={
        solo ? (
          <a
            href={enlaceDeAudiencia ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] tracking-widest text-ink/50 uppercase transition-colors hover:text-ink"
          >
            Ver como audiencia ↗
          </a>
        ) : (
          <span className="bg-verde px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase">
            Admin
          </span>
        )
      }
      rotulo={solo ? ["TU", "EVENTO"] : ["ADMIN", "PANEL"]}
      alSalir={() => void salir().then(() => navegar("/", { replace: true }))}
    >
      <span className="shrink-0 font-mono text-[11px] tracking-widest text-naranja uppercase">
        {solo ? "Tu evento, vos solo/a" : "Panel de administrador"}
      </span>
      <div className="mt-2 mb-8 flex shrink-0 items-center gap-4">
        {evento.logo && (
          <img
            src={evento.logo}
            alt=""
            className="size-12 shrink-0 border-[1.5px] border-[#443d30] object-cover"
          />
        )}
        <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase md:text-6xl">
          {evento.nombre}
        </h1>
      </div>

      <nav
        aria-label="Secciones del panel"
        className="mb-8 flex shrink-0 gap-2 overflow-x-auto border-b border-[#443d30]/20"
      >
        {PESTANAS.filter(
          (pestana) => !pestana.soloConEquipo || evento.tipo === "roles-separados",
        ).map((pestana) => (
          <button
            key={pestana.id}
            type="button"
            aria-current={pestana.id === activa ? "page" : undefined}
            onClick={() => cambiar(pestana.id)}
            className={`px-5 py-3 font-mono text-xs font-bold tracking-widest whitespace-nowrap uppercase transition-colors ${pestana.id === activa ? `border-b-[3px] ${pestana.acento} text-ink` : "border-b-[3px] border-transparent text-ink/40 hover:text-ink/70"}`}
          >
            {pestana.nombre}
          </button>
        ))}
      </nav>

      {PESTANAS.filter((pestana) => abiertas.includes(pestana.id)).map((pestana) => (
        <div
          key={pestana.id}
          hidden={pestana.id !== activa}
          className={`min-h-0 flex-1 flex-col ${pestana.id === activa ? "flex" : ""}`}
        >
          {paneles[pestana.id]({ evento, email, visible: pestana.id === activa, irA: cambiar })}
        </div>
      ))}
    </MarcoDelPanel>
  );
}
