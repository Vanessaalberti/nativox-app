import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  NOMBRES_DE_IDIOMA,
  type Idioma,
  type Linea,
  type SalaPublica,
} from "@compartido/contratos";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Boton, CargaConReintento } from "@navegador/interfaz/sistema-diseno";
import { useSala, type EstadoDeConexion } from "@navegador/modulos/cliente-sala";
import { charlaDeAhora, rango } from "../estado";
import { useAudiencia } from "../hooks/useAudiencia";

const TEXTO_DE_CONEXION: Record<EstadoDeConexion, string> = {
  conectando: "Conectando…",
  conectada: "En vivo",
  reconectando: "Reconectando…",
  reemplazada: "En vivo",
  cerrada: "Desconectado",
};

// /sala/:id/pantalla — la transcripción en vivo para la audiencia: se elige el idioma y se ven los
// subtítulos a medida que llegan, con el historial reciente para quien entra tarde. No corre ningún
// modelo ni pide cuenta ni micrófono: cambiar de idioma es instantáneo.
export function PantallaDeAudiencia({ salaId }: { salaId: string }) {
  const { carga, recargar } = useAudiencia();
  const [parametros] = useSearchParams();
  const [idioma, setIdioma] = useState<Idioma | null>(null);

  if (carga.fase !== "lista") {
    return (
      <MarcoDeEntrada>
        <CargaConReintento
          carga={carga}
          textoCargando="Abriendo la sala…"
          alReintentar={() => void recargar()}
        />
      </MarcoDeEntrada>
    );
  }

  const { audiencia } = carga;
  const sala = audiencia.salas.find((candidata) => candidata.id === salaId);
  if (!sala) {
    return (
      <MarcoDeEntrada evento={audiencia.evento}>
        <p role="alert" className="mb-6 font-mono text-sm">
          Esa sala no existe.
        </p>
        <Link
          to="/audiencia"
          className="font-mono text-xs font-bold tracking-widest uppercase underline"
        >
          ← Volver a las salas
        </Link>
      </MarcoDeEntrada>
    );
  }

  const ahora = new Date();
  const charla =
    sala.charlas.find((candidata) => candidata.id === parametros.get("charla")) ??
    charlaDeAhora(sala, ahora);

  return (
    <MarcoDeEntrada evento={audiencia.evento} ancho="ancho" centrado={false}>
      <Link
        to="/audiencia"
        className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase hover:text-ink"
      >
        ← Volver a salas
      </Link>
      <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
        {sala.nombre}
      </span>
      <h1 className="mt-2 mb-2 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase md:text-6xl">
        {charla?.titulo ?? "Transcripción en vivo"}
      </h1>
      {charla && <p className="mb-8 font-mono text-xs text-ink/60">{rango(charla)}</p>}

      {idioma === null ? (
        <ElegirIdioma sala={sala} alElegir={setIdioma} />
      ) : (
        <Transmision
          salaId={salaId}
          sala={sala}
          idioma={idioma}
          alCambiar={() => setIdioma(null)}
        />
      )}
    </MarcoDeEntrada>
  );
}

function ElegirIdioma({
  sala,
  alElegir,
}: {
  sala: SalaPublica;
  alElegir: (idioma: Idioma) => void;
}) {
  const [elegido, setElegido] = useState<Idioma | null>(null);
  const opciones = [sala.idiomaOriginal, ...sala.idiomasDestino];

  return (
    <section className="max-w-[900px]">
      <p className="mb-5 text-lg text-ink/80">
        Elegí en qué idioma querés ver la transcripción en vivo:
      </p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {opciones.map((idioma) => (
          <button
            key={idioma}
            type="button"
            onClick={() => setElegido(idioma)}
            aria-pressed={elegido === idioma}
            className={`p-4 text-center ${elegido === idioma ? "border-[3px] border-[#b8241f] bg-naranja" : "border-[1.5px] border-ink/30 bg-canvas hover:border-ink"}`}
          >
            <span className="mb-1 block font-mono text-[10px] tracking-widest text-ink/50 uppercase">
              {idioma}
            </span>
            <span className="text-sm font-bold">
              {NOMBRES_DE_IDIOMA[idioma]}
              {idioma === sala.idiomaOriginal && " (original)"}
            </span>
          </button>
        ))}
      </div>
      <Boton disabled={elegido === null} onClick={() => elegido && alElegir(elegido)}>
        Entrar a la transcripción →
      </Boton>
    </section>
  );
}

function Transmision({
  salaId,
  sala,
  idioma,
  alCambiar,
}: {
  salaId: string;
  sala: SalaPublica;
  idioma: Idioma;
  alCambiar: () => void;
}) {
  const { lineas, conexion } = useSala(salaId, "espectador");
  const fin = useRef<HTMLDivElement>(null);
  const conTexto = lineas.filter((linea) => linea.original.trim() !== "");

  // Siempre se ve lo último que llegó.
  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end" });
  }, [conTexto.length, lineas]);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <span
          role="status"
          className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase"
        >
          <span
            className={`size-2.5 rounded-full ${conexion === "conectada" ? "animate-titilar bg-verde" : "bg-ink/30"}`}
            aria-hidden
          />
          {TEXTO_DE_CONEXION[conexion]}
        </span>
        <span className="font-mono text-[11px] tracking-widest text-ink/60 uppercase">
          Transcripción en {NOMBRES_DE_IDIOMA[idioma]}
        </span>
        <button
          type="button"
          onClick={alCambiar}
          className="font-mono text-[11px] font-bold tracking-widest uppercase underline hover:text-naranja"
        >
          ← Cambiar idioma
        </button>
      </div>

      <div className="max-h-[60vh] min-h-[280px] overflow-y-auto border-[1.5px] border-ink/25 bg-escenario p-6 md:p-10">
        {conTexto.length === 0 ? (
          <p className="text-center font-sans text-xl text-canvas/40">
            {sala.enVivo
              ? "Esperando la próxima frase…"
              : "Todavía no empezó. Cuando la sala arranque, el texto aparece acá."}
          </p>
        ) : (
          <ol className="flex flex-col gap-5">
            {conTexto.map((linea) => (
              <li
                key={linea.id}
                className="font-sans text-2xl leading-snug text-canvas md:text-3xl"
              >
                <Texto linea={linea} idioma={idioma} idiomaOriginal={sala.idiomaOriginal} />
              </li>
            ))}
          </ol>
        )}
        <div ref={fin} />
      </div>
      <p className="mt-4 max-w-[760px] font-mono text-[11px] text-ink/60">
        El texto se genera en la sala y llega a tu pantalla: no hace falta instalar nada ni dar
        permisos.
      </p>
    </section>
  );
}

function Texto({
  linea,
  idioma,
  idiomaOriginal,
}: {
  linea: Linea;
  idioma: Idioma;
  idiomaOriginal: Idioma;
}) {
  const esOriginal = idioma === idiomaOriginal;
  const texto = esOriginal ? linea.original : linea.traducciones[idioma];
  // Una frase todavía sin confirmar se ve más tenue; y una traducción que aún no llegó, con puntos.
  return <span className={linea.provisoria ? "text-canvas/50 italic" : ""}>{texto ?? "…"}</span>;
}
