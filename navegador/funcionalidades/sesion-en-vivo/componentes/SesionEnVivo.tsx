import { Link } from "react-router";
import type { Idioma } from "@compartido/contratos";
import type { EstadoDeConexion } from "@navegador/modulos/cliente-sala";
import type { SesionEnVivo as Sesion } from "../hooks/useSesionEnVivo";
import { BorrarModelos } from "./BorrarModelos";
import { ControlSesion } from "./ControlSesion";
import { Mediciones } from "./Mediciones";
import { Transcripcion } from "./Transcripcion";

const TEXTO_DE_CONEXION: Record<EstadoDeConexion, string> = {
  conectando: "Conectando con la sala…",
  conectada: "Conectada a la sala",
  reconectando: "Reconectando con la sala…",
  reemplazada: "Otra computadora tomó esta sala",
  cerrada: "Desconectada",
};

export interface PropiedadesSesion {
  // Sin id (la sala de prueba) no se publica en ningún lado.
  salaId?: string;
  conexion?: EstadoDeConexion;
  comando?: string | null;
  inicial?: { original: Idioma; destino: Idioma[]; glosario: string };
  nombreSala: string;
  sesion: Sesion;
  alAbrirEscenario: () => void;
}

const boton =
  "rounded-sm border-[1.5px] border-ink px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:opacity-40";

export function SesionEnVivo({
  salaId,
  conexion,
  comando,
  inicial,
  nombreSala,
  sesion,
  alAbrirEscenario,
}: PropiedadesSesion) {
  const { estado } = sesion;
  const ocupada = estado.fase !== "inactiva" && estado.fase !== "error";

  return (
    <main className="grilla-fondo min-h-screen px-5 py-8 md:px-[72px]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/55">
            Sesión en vivo
          </span>
          <h1 className="font-display text-6xl leading-[0.9] tracking-tight uppercase">
            {nombreSala}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Estado sesion={sesion} />
          {conexion && (
            <span
              role="status"
              className={`font-mono text-[11px] ${conexion === "conectada" ? "text-ink/70" : "text-naranja"}`}
            >
              {conexion === "conectada" ? "●" : "○"} {TEXTO_DE_CONEXION[conexion]}
            </span>
          )}
          {salaId && (
            <nav className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] font-bold tracking-widest uppercase">
              <Link className="underline hover:text-naranja" to={`/sala/${salaId}/monitoreo`}>
                Monitoreo
              </Link>
              <Link className="underline hover:text-naranja" to={`/sala/${salaId}/subtitulos`}>
                Transmisión
              </Link>
              <Link className="underline hover:text-naranja" to={`/sala/${salaId}/pantalla`}>
                Audiencia
              </Link>
            </nav>
          )}
        </div>
      </header>
      {comando && (
        <p
          role="alert"
          className="mb-4 border-l-4 border-naranja bg-naranja/10 px-4 py-2 font-mono text-xs"
        >
          {comando}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-5">
          <ControlSesion
            ocupada={ocupada}
            {...(inicial ? { inicial } : {})}
            alIniciar={(configuracion) => void sesion.iniciar(configuracion)}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={boton}
              disabled={estado.fase !== "en-vivo"}
              onClick={() => void sesion.detener()}
            >
              ■ Detener
            </button>
            <button type="button" className={boton} onClick={alAbrirEscenario}>
              ⛶ Pantalla del escenario
            </button>
            <button type="button" className={boton} disabled={ocupada} onClick={sesion.limpiar}>
              Borrar la transcripción
            </button>
          </div>
          <BorrarModelos deshabilitado={ocupada} />
          {sesion.avisos.length > 0 && (
            <ul className="flex flex-col gap-1 border-l-4 border-naranja bg-naranja/10 px-4 py-3 font-mono text-xs">
              {sesion.avisos.map((aviso, indice) => (
                <li key={`${String(indice)}-${aviso}`}>{aviso}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <div className="border-[1.5px] border-ink/15 bg-canvas p-5">
            <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/55">
              Transcripción
            </h2>
            <Transcripcion lineas={sesion.lineas} idiomasDestino={sesion.idiomas.destino} />
          </div>
          <div className="border-[1.5px] border-ink/15 bg-canvas p-5">
            <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/55">
              Mediciones
            </h2>
            <Mediciones mediciones={sesion.mediciones} variante={sesion.variante} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Estado({ sesion }: { sesion: Sesion }) {
  const { estado } = sesion;
  if (estado.fase === "preparando") {
    const { detalle, proporcion } = estado.avance;
    return (
      <div className="flex min-w-64 flex-col gap-1.5 font-mono text-xs" role="status">
        <span>
          {detalle}
          {proporcion !== null ? ` · ${String(Math.round(proporcion * 100))}%` : "…"}
        </span>
        <div className="h-1.5 w-full bg-linea-fuerte">
          <div
            className="h-full bg-naranja transition-all"
            style={{ width: `${String(Math.round((proporcion ?? 0) * 100))}%` }}
          />
        </div>
      </div>
    );
  }
  if (estado.fase === "error") {
    return (
      <p
        role="alert"
        className="max-w-md border-l-4 border-red-600 bg-red-50 px-4 py-2 font-mono text-xs"
      >
        {estado.motivo}
      </p>
    );
  }
  const enVivo = estado.fase === "en-vivo";
  return (
    <span className="flex items-center gap-2 rounded-sm border-[1.5px] border-ink/20 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest">
      <span
        className={`size-2 rounded-full ${enVivo ? "animate-titilar bg-red-500" : "bg-ink/30"}`}
      />
      {enVivo
        ? "Capturando"
        : estado.fase === "terminando"
          ? "Terminando las últimas frases"
          : "Fuera de línea"}
    </span>
  );
}
