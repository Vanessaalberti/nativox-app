import { useEffect, useState, type ReactNode } from "react";
import type { Sala, SalidaDeProduccion } from "@compartido/contratos";
import {
  Aviso,
  Boton,
  CajaCopiable,
  CargaConReintento,
  EstadoVacio,
  useAlMostrarse,
  useEnvio,
} from "@navegador/interfaz/sistema-diseno";
import { EditorDeEstilo, VistaPreviaDeEstilo } from "@navegador/interfaz/subtitulos";
import { describirIdiomas } from "../idiomas";
import { useProduccion } from "../hooks/useProduccion";
import { RegistroDeAire } from "./RegistroDeAire";

// La pestaña "Producción": salidas con un link fijo cada una para vMix/OBS. Desde acá se elige qué
// sala sale en cada una (con un clic o con las teclas 1–9) sin tocar el programa de transmisión.
export function PanelDeProduccion({ visible }: { visible: boolean }) {
  const produccion = useProduccion();
  const [elegida, setElegida] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  useAlMostrarse(visible, () => void produccion.recargar());
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <p className="mb-6 max-w-[760px] shrink-0 text-sm text-ink/60">
        Elegí desde acá qué sala sale en el stream. Pegás <b>un solo link por salida</b> en OBS o
        vMix y cambiás de sala con un clic, sin tocar el programa de transmisión. Es opcional:
        también podés seguir usando el link de cada sala.
      </p>

      <div className="mb-6 flex shrink-0 flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[10px] tracking-widest text-ink/40 uppercase">
          Salidas
        </span>
        {salidas.map((salida) => (
          <button
            key={salida.numero}
            type="button"
            aria-pressed={salida.numero === actual?.numero}
            onClick={() => setElegida(salida.numero)}
            className={`border-[1.5px] px-3 py-2 font-mono text-[11px] font-bold tracking-widest uppercase ${salida.numero === actual?.numero ? "border-ink bg-ink text-canvas" : "border-[#443d30] text-ink/60 hover:border-ink"}`}
          >
            Salida {salida.numero} · {salida.nombre}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="border-[1.5px] border-dashed border-[#443d30]/60 px-3 py-2 font-mono text-[11px] font-bold tracking-widest text-ink/50 uppercase transition-colors hover:border-ink hover:text-ink"
        >
          + Nueva salida
        </button>
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

      {actual ? (
        <Salida
          key={actual.numero}
          salida={actual}
          salas={salas}
          registro={
            <RegistroDeAire
              version={salidas
                .map((salida) => `${String(salida.numero)}:${salida.salaAlAire ?? "-"}`)
                .join(",")}
              nombresDeSalidas={new Map(salidas.map((salida) => [salida.numero, salida.nombre]))}
            />
          }
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
  registro,
  alActualizar,
  alEliminar,
}: {
  salida: SalidaDeProduccion;
  salas: readonly Sala[];
  registro: ReactNode;
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
    <div className="grid grid-cols-1 gap-6 pb-10 xl:grid-cols-[1fr_520px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] tracking-widest text-ink/50 uppercase">
            Salas · tocá una para ponerla al aire (o teclas 1–9)
          </span>
          <button
            type="button"
            aria-pressed={salida.salaAlAire === null}
            onClick={() => void ponerAlAire(null)}
            className="font-mono text-[11px] font-bold tracking-widest text-ink/50 uppercase hover:text-[#b8241f]"
          >
            Sin subtítulos
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {salas.map((sala, indice) => {
            const alAireAhora = salida.salaAlAire === sala.id;
            return (
              <button
                key={sala.id}
                type="button"
                aria-pressed={alAireAhora}
                onClick={() => void ponerAlAire(sala.id)}
                className={`border-[1.5px] p-4 text-left transition-colors ${alAireAhora ? "border-[#b8241f] bg-[#b8241f]/[0.06]" : "border-[#443d30] bg-canvas hover:border-ink"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold">
                    {indice < 9 ? `${String(indice + 1)} · ` : ""}
                    {sala.nombre}
                  </span>
                  {alAireAhora && (
                    <span className="bg-[#b8241f] px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-canvas uppercase">
                      Al aire
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-snug text-ink/60">
                  {describirIdiomas(sala.idiomaOriginal, sala.idiomasDestino)}
                </p>
              </button>
            );
          })}
        </div>
        {salas.length === 0 && (
          <p className="mt-3 text-xs text-ink/50">
            Todavía no hay salas: creá las tuyas en la pestaña Salas.
          </p>
        )}
        {error !== null && (
          <div className="mt-3">
            <Aviso tipo="error">{error}</Aviso>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-widest text-ink/50 uppercase">
              Al aire en Salida {salida.numero}
            </span>
            <span
              className={`px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase ${alAire ? "bg-[#b8241f] text-canvas" : "bg-ink/10 text-ink/50"}`}
            >
              {alAire ? alAire.nombre : "Sin subtítulos"}
            </span>
          </div>
          <VistaPreviaDeEstilo estilo={estilo} idiomaOriginal={alAire?.idiomaOriginal ?? "es"} />
        </div>

        <div className="flex flex-col gap-3 border-[1.5px] border-[#443d30] bg-canvas p-4">
          <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
            Estilo de esta salida
          </span>
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
        </div>

        <div className="border-[1.5px] border-[#443d30] bg-canvas p-4">
          <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
            Link de esta salida (se pega una sola vez)
          </span>
          <div className="mt-2">
            <CajaCopiable valor={enlace} />
          </div>
          <p className="mt-2 text-xs leading-snug text-ink/60">
            <b>vMix:</b> Add Input → Web Browser → pegá el link → 1920 × 1080 → como Overlay.{" "}
            <b>OBS:</b> Fuentes → + → Navegador → pegá el link → 1920 × 1080. El fondo es
            transparente; los cambios de sala y de estilo se ven solos, sin tocar nada ahí.
          </p>
        </div>

        {registro}

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
    </div>
  );
}
