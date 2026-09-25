import type { ReactNode } from "react";
import { Aviso } from "./Aviso";

// El pie de las ventanas de confirmar: el motivo si algo falló, "Cancelar" y, a la derecha, la
// acción principal (que cada ventana pinta del color que le toca).
export function PieDeModal({
  error,
  alCancelar,
  children,
}: {
  error: string | null;
  alCancelar: () => void;
  children: ReactNode;
}) {
  return (
    <>
      {error !== null && (
        <div className="mb-4">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={alCancelar}
          className="font-mono text-xs font-bold tracking-widest text-ink/50 uppercase transition-colors hover:text-ink"
        >
          Cancelar
        </button>
        {children}
      </div>
    </>
  );
}
