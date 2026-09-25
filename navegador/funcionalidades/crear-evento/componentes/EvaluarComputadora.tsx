import type { Evaluacion, Motivo, Nivel } from "@navegador/modulos/evaluar-equipo";
import { Boton, ListaDeDatos } from "@navegador/interfaz/sistema-diseno";
import { useEvaluacion } from "../hooks/useEvaluacion";

const PASOS = [
  "Revisar la placa de video, la memoria y el procesador",
  "Medir la potencia de la placa (unos segundos)",
  "Recomendar cómo usarla",
];

const NOMBRES_DE_NIVEL: Record<Nivel, string> = {
  1: "Ahorro",
  2: "Equilibrado",
  3: "Rápido",
  4: "Máximo",
};

const segundos = (ms: number) =>
  Number.isFinite(ms) ? `${(ms / 1000).toLocaleString("es", { maximumFractionDigits: 1 })} s` : "—";

function explicar(motivo: Motivo): string {
  switch (motivo.codigo) {
    case "sin-webgpu":
      return "Esta computadora o este navegador no tiene WebGPU, que hace falta para correr Whisper en la placa.";
    case "f16-sin-comprimir":
      return "La placa soporta 16 bits: Whisper corre sin comprimir, con mejor calidad.";
    case "sin-f16-comprimido":
      return "La placa no soporta 16 bits: Whisper corre comprimido (4 bits), que rinde bien en equipos más modestos.";
    case "poca-memoria":
      return `Tiene poca memoria (${String(motivo.memoriaGb)} GB): conviene cerrar otras pestañas durante el evento.`;
    case "pasada-rapida":
      return `Estimamos ${segundos(motivo.pasadaMs)} por pasada de Whisper: alcanza para actualizar el texto muy seguido.`;
    case "pasada-media":
      return `Estimamos ${segundos(motivo.pasadaMs)} por pasada de Whisper: el texto provisorio se actualiza cada un par de segundos.`;
    case "pasada-lenta":
      return `Estimamos ${segundos(motivo.pasadaMs)} por pasada de Whisper: conviene mostrar frases completas para que no se acumule cola.`;
    case "pasada-muy-lenta":
      return `Estimamos ${segundos(motivo.pasadaMs)} por pasada de Whisper: es más de lo que dura una frase.`;
    case "no-llega-en-vivo":
      return `Con ${segundos(motivo.pasadaMs)} por pasada el texto se atrasaría más y más, incluso con frases completas.`;
    case "margen-para-gemma":
      return "La placa es potente y tiene 16 bits: tendría margen para un traductor de más calidad.";
    case "gemma-pide-memoria":
      return "TranslateGemma pide un modelo de ~2 GB y esta computadora no tiene memoria de sobra: conviene Bergamot.";
  }
}

// "Antes del evento": un clic que revisa la computadora sin descargar nada y dice cómo usarla.
export function EvaluarComputadora() {
  const { estado, evaluar } = useEvaluacion();
  const evaluando = estado.fase === "evaluando";
  const actual = evaluando ? (estado.avance.etapa === "detectando" ? 0 : 1) : -1;

  return (
    <section className="flex flex-col gap-4 border-[1.5px] border-ink/25 bg-canvas p-5 text-left">
      <div>
        <span className="font-mono text-[10px] font-bold tracking-widest text-naranja uppercase">
          Antes del evento
        </span>
        <h2 className="mt-1 font-display text-4xl leading-none uppercase">
          Evaluá esta computadora
        </h2>
        <p className="mt-2 text-sm text-ink/80">
          Un clic: revisamos la placa de video, la memoria y el procesador, y medimos cuánta
          potencia tiene. No se descarga ni se instala nada. Hacelo también en la computadora de
          cada sala.
        </p>
      </div>

      <ol className="grid gap-1.5 font-mono text-xs">
        {PASOS.map((paso, indice) => {
          const hecho = estado.fase === "lista" || indice < actual;
          return (
            <li
              key={paso}
              className={`flex items-center gap-2 ${indice === actual ? "font-bold" : "text-ink/60"}`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center text-[10px] ${hecho ? "bg-verde" : indice === actual ? "bg-naranja" : "border border-ink/25"}`}
              >
                {hecho ? "✓" : String(indice + 1).padStart(2, "0")}
              </span>
              {paso}
            </li>
          );
        })}
      </ol>

      <div>
        <Boton variante="secundario" disabled={evaluando} onClick={() => void evaluar()}>
          {evaluando
            ? "Evaluando…"
            : estado.fase === "lista"
              ? "Volver a evaluar"
              : "Evaluar esta computadora"}
        </Boton>
      </div>

      <div role="status" aria-live="polite" className="flex flex-col gap-3 text-sm">
        {estado.fase === "error" && (
          <p className="font-mono text-xs text-[#b8241f]">No pudimos evaluar: {estado.motivo}</p>
        )}
        {estado.fase === "lista" && <Resultado evaluacion={estado.evaluacion} />}
      </div>
    </section>
  );
}

function Resultado({ evaluacion: { equipo, medidas, recomendacion } }: { evaluacion: Evaluacion }) {
  const filas: [string, string][] = [
    ["Placa de video", equipo.placa ?? "el navegador no informa el modelo"],
    ["WebGPU", equipo.webgpu ? "Sí" : "No"],
    ["16 bits (f16)", equipo.f16 ? "Sí" : "No"],
    [
      "Memoria RAM",
      equipo.memoriaGb === null
        ? "el navegador no lo informa"
        : `${String(equipo.memoriaGb)} GB (aprox.)`,
    ],
    [
      "Núcleos del procesador",
      equipo.nucleos === null ? "el navegador no lo informa" : String(equipo.nucleos),
    ],
  ];
  if (medidas) filas.push(["Una pasada de Whisper (estimada)", segundos(medidas.pasadaEstimadaMs)]);

  return (
    <>
      <ListaDeDatos filas={filas} />
      <div className="border-[1.5px] border-verde bg-verde/10 p-3">
        <p className="font-mono text-[10px] font-bold tracking-widest uppercase">
          Recomendado para esta computadora
        </p>
        {recomendacion.version === null ? (
          <p className="mt-1 font-bold">No puede correr Whisper en vivo por sí sola.</p>
        ) : (
          <p className="mt-1 font-bold">
            Nivel {recomendacion.nivel} · {NOMBRES_DE_NIVEL[recomendacion.nivel]} · Whisper{" "}
            {recomendacion.version === "fp16" ? "sin comprimir (16 bits)" : "comprimido (4 bits)"}
          </p>
        )}
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-xs text-ink/80">
          {recomendacion.motivos.map((motivo) => (
            <li key={motivo.codigo}>{explicar(motivo)}</li>
          ))}
        </ul>
        {recomendacion.usarNube && (
          <p className="mt-2 text-xs font-bold text-naranja">
            Para esta computadora conviene la transcripción en la nube (opcional, abajo).
          </p>
        )}
      </div>
      <p className="font-mono text-[11px] text-ink/60">
        Lo podés cambiar en la sesión en vivo con la barra de velocidad. Es una estimación: la
        pasada real se ve al probar.
      </p>
    </>
  );
}
