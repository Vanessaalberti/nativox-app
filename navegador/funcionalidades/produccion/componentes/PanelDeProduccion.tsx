import { useEffect, useState } from "react";
import type { Sala, SalidaDeProduccion } from "@compartido/contratos";
import {
  Aviso,
  Boton,
  CajaCopiable,
  CargaConReintento,
  EstadoVacio,
  useEnvio,
} from "@navegador/interfaz/sistema-diseno";
import { EditorDeEstilo, VistaPreviaDeEstilo } from "@navegador/interfaz/subtitulos";
import { useProduccion } from "../hooks/useProduccion";
import { RegistroDeAire } from "./RegistroDeAire";

// La pestaña "Producción": salidas con un link fijo cada una para vMix/OBS. Desde acá se elige qué
// sala sale en cada una (con un clic o con las teclas 1–9) sin tocar el programa de transmisión.
export function PanelDeProduccion() {
  const produccion = useProduccion();
  const [elegida, setElegida] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const { carga } = produccion;

  if (carga.fase !== "lista") {
    return (
      <CargaConReintento
        carga={carga}
        textoCargando="Cargando la producción…"
        alReintentar={() => void produccion.recargar()}
      />
    );
  }

  const { salidas, salas } = carga;
  const actual = salidas.find((salida) => salida.numero === elegida) ?? salidas[0] ?? null;

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-[860px] text-base text-ink/80">
        Elegí desde acá qué sala sale en el stream. Pegás un solo link por salida en OBS o vMix y
        cambiás de sala con un clic, sin tocar el programa de transmisión. Es opcional: también
        podés seguir usando el link de cada sala.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {salidas.map((salida) => (
          <button
            key={salida.numero}
            type="button"
            aria-pressed={salida.numero === actual?.numero}
            onClick={() => setElegida(salida.numero)}
            className={`px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase ${salida.numero === actual?.numero ? "border-[3px] border-[#b8241f] bg-naranja" : "border-[1.5px] border-ink/30 hover:border-ink"}`}
          >
            {salida.nombre}
          </button>
        ))}
        <Boton variante="secundario" onClick={() => setCreando(true)}>
          + Nueva salida
        </Boton>
      </div>

      {creando && (
        <NuevaSalida
          siguiente={salidas.length + 1}
          alCrear={async (nombre) => {
            const motivo = await produccion.crear(nombre);
            if (motivo === null) setCreando(false);
            return motivo;
          }}
          alCancelar={() => setCreando(false)}
        />
      )}

      <RegistroDeAire
        version={salidas
          .map((salida) => `${String(salida.numero)}:${salida.salaAlAire ?? "-"}`)
          .join(",")}
        nombresDeSalidas={new Map(salidas.map((salida) => [salida.numero, salida.nombre]))}
      />

      {actual ? (
        <Salida
          key={actual.numero}
          salida={actual}
          salas={salas}
          alActualizar={(datos) => produccion.actualizar(actual.numero, datos)}
          alEliminar={async () => {
            const motivo = await produccion.eliminar(actual.numero);
            if (motivo === null) setElegida(null);
            return motivo;
          }}
        />
      ) : (
        !creando && (
          <EstadoVacio
            titulo="Todavía no creaste ninguna salida"
            texto="Cada salida es un link fijo para vMix u OBS. Creá la primera para empezar."
          >
            <Boton onClick={() => setCreando(true)}>+ Nueva salida</Boton>
          </EstadoVacio>
        )
      )}
    </div>
  );
}

function NuevaSalida({
  siguiente,
  alCrear,
  alCancelar,
}: {
  siguiente: number;
  alCrear: (nombre: string) => Promise<string | null>;
  alCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(
    siguiente === 1 ? "Programa" : `Salida ${String(siguiente)}`,
  );
  const { error, enviando, enviar } = useEnvio();

  return (
    <form
      className="flex max-w-[560px] flex-col gap-3 border-[1.5px] border-ink/25 bg-canvas p-5"
      onSubmit={(evento) => {
        evento.preventDefault();
        void enviar(() => alCrear(nombre));
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
          Nombre de la salida
        </span>
        <input
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          className="border-[1.5px] border-ink/25 bg-canvas px-3 py-2 font-mono text-sm outline-none focus:border-naranja"
        />
      </label>
      {error !== null && <Aviso tipo="error">{error}</Aviso>}
      <div className="flex gap-3">
        <Boton variante="secundario" onClick={alCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={enviando || nombre.trim() === ""}>
          Crear salida
        </Boton>
      </div>
    </form>
  );
}

function Salida({
  salida,
  salas,
  alActualizar,
  alEliminar,
}: {
  salida: SalidaDeProduccion;
  salas: readonly Sala[];
  alActualizar: (datos: {
    nombre: string;
    salaAlAire: string | null;
    estilo: SalidaDeProduccion["estilo"];
  }) => Promise<string | null>;
  alEliminar: () => Promise<string | null>;
}) {
  const [estilo, setEstilo] = useState(salida.estilo);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const alAire = salas.find((sala) => sala.id === salida.salaAlAire) ?? null;
  const enlace = `${window.location.origin}/produccion/salida-${String(salida.numero)}`;

  const ponerAlAire = async (salaAlAire: string | null) => {
    setError(await alActualizar({ nombre: salida.nombre, salaAlAire, estilo: salida.estilo }));
  };

  // Teclas 1–9 ponen la sala de esa posición al aire; 0, "sin subtítulos". No se activan mientras
  // se escribe en un campo.
  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      const destino = evento.target;
      if (destino instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(destino.tagName))
        return;
      if (!/^[0-9]$/.test(evento.key)) return;
      const posicion = Number(evento.key);
      if (posicion === 0) void ponerAlAire(null);
      else if (salas[posicion - 1]) void ponerAlAire(salas[posicion - 1]?.id ?? null);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [salas, salida]);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-3 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Salas · tocá una para ponerla al aire (o teclas 1–9)
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              aria-pressed={salida.salaAlAire === null}
              onClick={() => void ponerAlAire(null)}
              className={`px-4 py-3 font-mono text-xs font-bold tracking-widest uppercase ${salida.salaAlAire === null ? "border-[3px] border-[#b8241f] bg-naranja" : "border-[1.5px] border-ink/30 hover:border-ink"}`}
            >
              0 · Sin subtítulos
            </button>
            {salas.map((sala, indice) => (
              <button
                key={sala.id}
                type="button"
                aria-pressed={salida.salaAlAire === sala.id}
                onClick={() => void ponerAlAire(sala.id)}
                className={`px-4 py-3 font-mono text-xs font-bold tracking-widest uppercase ${salida.salaAlAire === sala.id ? "border-[3px] border-[#b8241f] bg-naranja" : "border-[1.5px] border-ink/30 hover:border-ink"}`}
              >
                {indice < 9 ? `${String(indice + 1)} · ` : ""}
                {sala.nombre}
              </button>
            ))}
          </div>
          {salas.length === 0 && (
            <p className="mt-3 font-mono text-xs text-ink/60">
              Todavía no hay salas: creá una en la pestaña Salas.
            </p>
          )}
          {error !== null && <Aviso tipo="error">{error}</Aviso>}
        </section>

        <section>
          <h2 className="mb-2 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Link de esta salida (se pega una sola vez)
          </h2>
          <CajaCopiable valor={enlace} />
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink/60">
            vMix: Add Input → Web Browser → pegá el link → 1920 × 1080 → como Overlay. OBS: Fuentes
            → + → Navegador → pegá el link → 1920 × 1080. El fondo es transparente; los cambios de
            sala y de estilo se ven solos, sin tocar nada ahí.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Estilo de esta salida
          </h2>
          <EditorDeEstilo
            estilo={estilo}
            idiomas={
              alAire ? [alAire.idiomaOriginal, ...alAire.idiomasDestino] : ["es", "en", "pt"]
            }
            alCambiar={(nuevo) => {
              setEstilo(nuevo);
              setGuardado(false);
            }}
          />
          <div className="flex flex-wrap items-center gap-4">
            <Boton
              onClick={() =>
                void alActualizar({
                  nombre: salida.nombre,
                  salaAlAire: salida.salaAlAire,
                  estilo,
                }).then((motivo) => {
                  setError(motivo);
                  setGuardado(motivo === null);
                })
              }
            >
              Guardar el estilo
            </Boton>
            {guardado && <span className="font-mono text-xs text-ink/70">Guardado.</span>}
          </div>
        </section>

        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(`¿Eliminar la salida «${salida.nombre}»? Su link deja de funcionar.`)
            ) {
              void alEliminar().then(setError);
            }
          }}
          className="self-start font-mono text-xs tracking-widest text-[#b8241f] uppercase underline"
        >
          Eliminar esta salida
        </button>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
          Vista previa del programa · al aire en {alAire ? alAire.nombre : "ninguna sala"}
        </h2>
        <VistaPreviaDeEstilo estilo={estilo} idiomaOriginal={alAire?.idiomaOriginal ?? "es"} />
        <p className="font-mono text-[11px] text-ink/60">
          La vista previa usa frases de muestra: el estilo es el que ves acá.
        </p>
      </section>
    </div>
  );
}
