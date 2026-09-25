import type { Sala } from "@compartido/contratos";
import { SelectorDeSalas } from "./SelectorDeSalas";

// "Sala 1, Sala 2 ▾": un desplegable con las salas para tildar. En la tabla se ve como texto; en
// los formularios, como un campo.
export function DesplegableDeSalas({
  salas,
  elegidas,
  alCambiar,
  variante,
}: {
  salas: readonly Sala[];
  elegidas: readonly string[];
  alCambiar: (elegidas: string[]) => void;
  variante: "celda" | "campo";
}) {
  const nombres = salas.filter((sala) => elegidas.includes(sala.id)).map((sala) => sala.nombre);
  const resumen = nombres.length === 0 ? "Sin salas" : nombres.join(", ");
  const enCampo = variante === "campo";

  return (
    <details className={`relative ${enCampo ? "w-[200px] shrink-0" : ""}`}>
      <summary
        className={`cursor-pointer list-none ${enCampo ? "flex items-center justify-between gap-2 border-[1.5px] border-[#443d30] px-3 py-2 font-mono text-xs text-ink/70" : "inline-flex items-center gap-1.5 hover:text-ink"}`}
      >
        <span className={enCampo ? "truncate" : ""}>{resumen}</span>
        <span className="shrink-0 text-ink/40">▾</span>
      </summary>
      <div
        className={`absolute z-10 mt-1 max-h-[180px] overflow-y-auto border-[1.5px] border-[#443d30] bg-canvas p-3 ${enCampo ? "right-0 w-[220px]" : "left-0 min-w-[200px]"}`}
      >
        <SelectorDeSalas salas={salas} elegidas={elegidas} alCambiar={alCambiar} />
      </div>
    </details>
  );
}
