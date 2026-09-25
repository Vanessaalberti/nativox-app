import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { EstiloSalida, Transmision } from "@compartido/contratos";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import {
  Aviso,
  Boton,
  CajaCopiable,
  CargaConReintento,
  PieDeFormulario,
  useEnvio,
} from "@navegador/interfaz/sistema-diseno";
import { guardarEstiloDeSala, leerTransmisionDeSala } from "@navegador/modulos/cliente-instancia";
import { EditorDeEstilo, VistaPreviaDeEstilo } from "@navegador/interfaz/subtitulos";

type Carga =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; transmision: Transmision };

// /sala/:id/subtitulos — el estilo de los subtítulos de una sala en vMix/OBS, con vista previa y
// el link fijo para pegar una sola vez. El estilo se guarda por sala (no viaja en el link).
export function ConfiguradorDeSala({ salaId, volverA }: { salaId: string; volverA: string }) {
  const [carga, setCarga] = useState<Carga>({ fase: "cargando" });

  useEffect(() => {
    void leerTransmisionDeSala(salaId).then((respuesta) =>
      setCarga(
        respuesta.ok
          ? { fase: "lista", transmision: respuesta.valor }
          : { fase: "error", motivo: respuesta.motivo },
      ),
    );
  }, [salaId]);

  if (carga.fase !== "lista" || !carga.transmision.sala) {
    return (
      <MarcoDeEntrada>
        <CargaConReintento
          carga={carga.fase === "error" ? carga : { fase: "cargando" }}
          textoCargando="Abriendo la configuración…"
          alReintentar={() => window.location.reload()}
        />
      </MarcoDeEntrada>
    );
  }

  return (
    <Editor
      salaId={salaId}
      nombre={carga.transmision.sala.nombre}
      idiomas={[carga.transmision.sala.idiomaOriginal, ...carga.transmision.sala.idiomasDestino]}
      idiomaOriginal={carga.transmision.sala.idiomaOriginal}
      inicial={carga.transmision.estilo}
      volverA={volverA}
    />
  );
}

function Editor({
  salaId,
  nombre,
  idiomas,
  idiomaOriginal,
  inicial,
  volverA,
}: {
  salaId: string;
  nombre: string;
  idiomas: ("es" | "en" | "pt")[];
  idiomaOriginal: "es" | "en" | "pt";
  inicial: EstiloSalida;
  volverA: string;
}) {
  const [estilo, setEstilo] = useState(inicial);
  const [guardado, setGuardado] = useState(false);
  const { error, enviando, enviar } = useEnvio();
  const enlace = `${window.location.origin}/sala/${salaId}/transmision`;

  return (
    <MarcoDeEntrada ancho="ancho" centrado={false}>
      <Link
        to={volverA}
        className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase hover:text-ink"
      >
        ← Volver
      </Link>
      <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
        Subtítulos para vMix y OBS
      </span>
      <h1 className="mt-2 mb-8 font-display text-6xl leading-[0.95] font-extrabold tracking-tight uppercase">
        {nombre}
      </h1>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form
          className="flex flex-col gap-6"
          onSubmit={(evento) => {
            evento.preventDefault();
            setGuardado(false);
            void enviar(async () => {
              const respuesta = await guardarEstiloDeSala(salaId, estilo);
              if (respuesta.ok) setGuardado(true);
              return respuesta.ok ? null : respuesta.motivo;
            });
          }}
        >
          <EditorDeEstilo
            estilo={estilo}
            idiomas={idiomas}
            alCambiar={(nuevo) => {
              setEstilo(nuevo);
              setGuardado(false);
            }}
          />
          <PieDeFormulario error={error} deshabilitado={enviando} etiqueta="Guardar el estilo" />
          {guardado && (
            <Aviso>Estilo guardado: el link ya lo usa, sin tocar nada en vMix ni OBS.</Aviso>
          )}
        </form>

        <div className="flex flex-col gap-6">
          <VistaPreviaDeEstilo estilo={estilo} idiomaOriginal={idiomaOriginal} />
          <section>
            <h2 className="mb-2 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
              Link de esta sala (se pega una sola vez)
            </h2>
            <CajaCopiable valor={enlace} />
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink/60">
              vMix: Add Input → Web Browser → pegá el link → 1920 × 1080 → como Overlay. OBS:
              Fuentes → + → Navegador → pegá el link → 1920 × 1080. El fondo es transparente y los
              cambios de estilo se ven solos.
            </p>
          </section>
          <Boton variante="secundario" onClick={() => window.open(enlace, "_blank", "noopener")}>
            Abrir el link en otra pestaña ↗
          </Boton>
        </div>
      </div>
    </MarcoDeEntrada>
  );
}
