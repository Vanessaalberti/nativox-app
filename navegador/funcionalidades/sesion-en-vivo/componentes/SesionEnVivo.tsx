import { useEffect } from "react";
import { Link, useBlocker, useLocation, useNavigate } from "react-router";
import { useRef } from "react";
import type { Charla, Idioma } from "@compartido/contratos";
import { actualizarCharla } from "@navegador/modulos/cliente-instancia";
import type { EstadoDeConexion } from "@navegador/modulos/cliente-sala";
import type { SesionEnVivo as Sesion } from "../hooks/useSesionEnVivo";
import { BorrarModelos } from "./BorrarModelos";
import { charlaDeAhora } from "../hooks/useDatosDeLaSala";
import { ControlSesion, type EleccionDeCharla } from "./ControlSesion";
import { EnlaceDeEscenario } from "./EnlaceDeEscenario";
import { Mediciones } from "./Mediciones";
import { Transcripcion } from "./Transcripcion";
import { VideoDeLaFuente } from "./VideoDeLaFuente";

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
  // Las charlas de la agenda de la sala y a cuál se le guarda lo que se transcribe.
  charlas: readonly Charla[];
  eleccionDeCharla: EleccionDeCharla;
  alElegirCharla: (eleccion: EleccionDeCharla) => void;
  // Adónde volver si no hay pantalla anterior (el panel de quien entró).
  volverA: string;
  sesion: Sesion;
  alAbrirEscenario: () => void;
}

const AVISO_DE_SALIDA =
  "Si salís de esta pestaña se corta la transmisión: de acá sale toda la transcripción y la traducción. ¿Salir igual?";

const boton =
  "rounded-sm border-[1.5px] border-ink px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:opacity-40";

export function SesionEnVivo({
  salaId,
  conexion,
  comando,
  inicial,
  nombreSala,
  charlas,
  eleccionDeCharla,
  alElegirCharla,
  volverA,
  sesion,
  alAbrirEscenario,
}: PropiedadesSesion) {
  const { estado } = sesion;
  const ocupada = estado.fase !== "inactiva" && estado.fase !== "error";
  const navegar = useNavigate();
  const { key } = useLocation();
  // La charla a la que se le guarda lo transcripto y su glosario, con lo que se fue sumando.
  const charla =
    eleccionDeCharla === "agenda"
      ? charlaDeAhora(charlas)
      : eleccionDeCharla === "ninguna"
        ? null
        : (charlas.find((candidata) => candidata.id === eleccionDeCharla) ?? null);
  const glosarios = useRef(new Map<string, string>());

  // Esta pestaña es donde ocurre la transcripción y la traducción: salir la corta. Al cerrarla,
  // recargarla o irse a otra dirección el navegador avisa; dentro de la aplicación, también.
  const bloqueo = useBlocker(
    ({ currentLocation, nextLocation }) =>
      ocupada && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (bloqueo.state !== "blocked") return;
    if (window.confirm(AVISO_DE_SALIDA)) bloqueo.proceed();
    else bloqueo.reset();
  }, [bloqueo]);
  useEffect(() => {
    if (!ocupada) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [ocupada]);

  // Una corrección que vale para lo que sigue: entra al glosario de la sesión que está corriendo y
  // se guarda en el de la charla (para la próxima vez que se transcriba).
  const recordar = async (entrada: string): Promise<string | null> => {
    sesion.agregarAlGlosario(entrada);
    if (!charla) return null;
    const actual = glosarios.current.get(charla.id) ?? charla.glosario;
    if (actual.split("\n").includes(entrada)) return null;
    const nuevo = actual === "" ? entrada : `${actual}\n${entrada}`;
    const respuesta = await actualizarCharla(charla.id, {
      titulo: charla.titulo,
      resumen: charla.resumen,
      oradores: charla.oradores,
      fecha: charla.fecha,
      inicioMin: charla.inicioMin,
      finMin: charla.finMin,
      idioma: charla.idioma,
      glosario: nuevo,
    });
    if (!respuesta.ok) {
      return `Vale para esta sesión, pero no se pudo guardar en la charla: ${respuesta.motivo}`;
    }
    glosarios.current.set(charla.id, nuevo);
    return null;
  };

  return (
    <main className="grilla-fondo min-h-screen px-5 py-8 md:px-[72px]">
      <button
        type="button"
        onClick={() => void (key === "default" ? navegar(volverA) : navegar(-1))}
        className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase hover:text-ink"
      >
        ← Volver
      </button>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/55">
            Sesión en vivo
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <h1 className="font-display text-6xl leading-[0.9] tracking-tight uppercase">
              {nombreSala}
            </h1>
            <p
              role="note"
              className={`max-w-[420px] border-l-4 px-3 py-1.5 font-mono text-[11px] leading-snug ${ocupada ? "border-[#b8241f] bg-[#b8241f]/10" : "border-ink/25 bg-ink/5"}`}
            >
              {ocupada
                ? "No salgas ni cierres esta pestaña mientras dure la transmisión: de acá sale toda la transcripción y la traducción."
                : "Esta pestaña es la que transcribe y traduce esta sala: cuando inicies, no la cierres ni salgas de ella."}
            </p>
          </div>
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
              <Link
                className="underline hover:text-naranja"
                to={`/sala/${salaId}/monitoreo`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Monitoreo
              </Link>
              <Link
                className="underline hover:text-naranja"
                to={`/sala/${salaId}/subtitulos`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Transmisión
              </Link>
              <Link
                className="underline hover:text-naranja"
                to={`/sala/${salaId}/pantalla`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Audiencia
              </Link>
            </nav>
          )}
        </div>
      </header>
      {sesion.configuracion?.prueba === true && ocupada && (
        <p
          role="status"
          className="mb-4 border-l-4 border-verde bg-verde/10 px-4 py-2 font-mono text-xs"
        >
          Modo prueba: lo que se transcribe se ve y se mide acá, pero no se publica en la sala ni se
          guarda en ninguna charla.
        </p>
      )}
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
            charlas={charlas}
            eleccionDeCharla={eleccionDeCharla}
            alElegirCharla={alElegirCharla}
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
          {salaId && (
            <EnlaceDeEscenario
              salaId={salaId}
              idiomas={inicial ? [inicial.original, ...inicial.destino] : ["es", "en", "pt"]}
            />
          )}
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
          {sesion.video && <VideoDeLaFuente video={sesion.video} />}
          <div className="border-[1.5px] border-ink/15 bg-canvas p-5">
            <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/55">
              Transcripción
            </h2>
            <Transcripcion
              lineas={sesion.lineas}
              idiomasDestino={sesion.idiomas.destino}
              alCorregir={sesion.corregirLinea}
              alRecordar={recordar}
            />
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
