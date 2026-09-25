import type { ReactNode } from "react";

// Un renglón de una lista de cosas del evento (una sala): el nombre grande, un detalle chico y, a
// la derecha, sus acciones.
export function TarjetaDeLista({
  titulo,
  detalle,
  children,
}: {
  titulo: string;
  detalle: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border-[1.5px] border-ink/25 bg-canvas p-4">
      <div>
        <h2 className="font-display text-3xl leading-none uppercase">{titulo}</h2>
        <p className="mt-1 font-mono text-xs text-ink/60">{detalle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">{children}</div>
    </li>
  );
}
