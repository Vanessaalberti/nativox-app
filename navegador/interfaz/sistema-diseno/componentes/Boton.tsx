import type { ButtonHTMLAttributes, ReactNode } from "react";

// El naranja marca la acción principal; el verde, los pasos de "crear evento"; el borde solo, lo
// secundario.
const VARIANTES = {
  principal: "border-[3px] border-[#b8241f] bg-naranja text-ink hover:bg-[#e67b00]",
  acento: "border-[3px] border-[#2f8a70] bg-verde text-ink hover:bg-[#3bab8a]",
  secundario:
    "border-[1.5px] border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-canvas",
} as const;

export interface PropiedadesBoton extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  variante?: keyof typeof VARIANTES;
  children: ReactNode;
}

export function Boton({
  variante = "principal",
  children,
  type = "button",
  ...resto
}: PropiedadesBoton) {
  return (
    <button
      type={type}
      className={`group inline-flex items-center justify-center gap-3 px-6 py-3.5 font-mono text-sm font-bold tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTES[variante]}`}
      {...resto}
    >
      {children}
    </button>
  );
}
