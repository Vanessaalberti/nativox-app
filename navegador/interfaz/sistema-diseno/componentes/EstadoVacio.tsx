import type { ReactNode } from "react";

// Lo que se muestra cuando todavía no hay nada que listar (salas, personas): un "+", qué falta y,
// si se quiere, la acción para empezar.
export function EstadoVacio({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 border-[1.5px] border-dashed border-ink/30 px-6 py-16 text-center">
      <span className="font-display text-5xl text-naranja" aria-hidden>
        +
      </span>
      <h2 className="font-display text-3xl uppercase">{titulo}</h2>
      <p className="text-sm text-ink/70">{texto}</p>
      {children}
    </div>
  );
}
