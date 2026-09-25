import type { Sala } from "@compartido/contratos";

// Las salas que se pueden asignar, con una casilla cada una.
export function SelectorDeSalas({
  salas,
  elegidas,
  alCambiar,
}: {
  salas: readonly Sala[];
  elegidas: readonly string[];
  alCambiar: (elegidas: string[]) => void;
}) {
  if (salas.length === 0) {
    return <p className="text-xs whitespace-nowrap text-ink/40">Todavía no hay salas creadas.</p>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      {salas.map((sala) => (
        <label
          key={sala.id}
          className="flex cursor-pointer items-center gap-2 text-xs whitespace-nowrap text-ink/80"
        >
          <input
            type="checkbox"
            checked={elegidas.includes(sala.id)}
            onChange={(evento) =>
              alCambiar(
                evento.target.checked
                  ? [...elegidas, sala.id]
                  : elegidas.filter((id) => id !== sala.id),
              )
            }
            className="size-3.5 accent-verde"
          />
          {sala.nombre}
        </label>
      ))}
    </div>
  );
}
