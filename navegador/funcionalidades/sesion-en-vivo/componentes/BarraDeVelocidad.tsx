import { NIVELES, NOMBRES_DE_NIVEL, type Nivel } from "@navegador/modulos/evaluar-equipo";

const DESCRIPCIONES: Record<Nivel, string> = {
  1: "Frases completas: el texto aparece al terminar cada frase. Es lo que menos le exige a la placa.",
  2: "Texto provisorio cada ~2 s mientras se habla.",
  3: "Texto provisorio cada ~1 s: casi instantáneo.",
  4: "Lo más seguido que dé la placa. La exige al máximo.",
};

// La barra de velocidad: cuatro escalones (Ahorro, Equilibrado, Rápido, Máximo). La evaluación de
// la computadora deja marcado el recomendado y se puede cambiar a mano.
export function BarraDeVelocidad({
  nivel,
  recomendado,
  deshabilitada,
  alCambiar,
}: {
  nivel: Nivel;
  // El nivel que recomendó la evaluación; null si todavía no se evaluó.
  recomendado: Nivel | null;
  deshabilitada: boolean;
  alCambiar: (nivel: Nivel) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={deshabilitada}>
      <legend className="font-mono text-[10px] font-bold tracking-widest text-ink/60 uppercase">
        Nivel de velocidad
      </legend>
      <p className="font-mono text-[11px] text-ink/55">
        Cuánto trabajo le pedís a la placa. Más nivel, el texto aparece antes.
      </p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4" role="radiogroup">
        {NIVELES.map(({ nivel: opcion }) => {
          const elegido = opcion === nivel;
          return (
            <button
              key={opcion}
              type="button"
              role="radio"
              aria-checked={elegido}
              onClick={() => alCambiar(opcion)}
              className={`flex flex-col items-start gap-1 border-[1.5px] px-3 py-2 text-left font-mono transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${elegido ? "border-ink bg-ink text-canvas" : "border-ink/25 bg-canvas hover:border-ink/60"}`}
            >
              <span className="flex w-full items-center justify-between gap-2 text-[11px] font-bold tracking-widest uppercase">
                <span>
                  {String(opcion)} · {NOMBRES_DE_NIVEL[opcion]}
                </span>
                {recomendado === opcion && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] ${elegido ? "bg-naranja text-ink" : "bg-verde text-ink"}`}
                  >
                    Recomendado
                  </span>
                )}
              </span>
              <span className="flex gap-0.5" aria-hidden>
                {NIVELES.map(({ nivel: escalon }) => (
                  <span
                    key={escalon}
                    className={`h-1.5 w-5 ${escalon <= opcion ? (elegido ? "bg-naranja" : "bg-ink/60") : elegido ? "bg-canvas/25" : "bg-ink/15"}`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="font-mono text-xs text-ink/75">{DESCRIPCIONES[nivel]}</p>
      {recomendado === null && (
        <p className="font-mono text-[11px] text-ink/50">
          Todavía no evaluaste esta computadora: arranca en Equilibrado.
        </p>
      )}
      {recomendado !== null && nivel > recomendado && (
        <p className="font-mono text-[11px] text-naranja">
          Es más exigente que lo recomendado para esta placa: si el texto se atrasa, bajá un nivel.
        </p>
      )}
    </fieldset>
  );
}
