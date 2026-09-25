import type { ReactNode } from "react";

const CAJAS = {
  normal: "border-t border-[#443d30]/20 pt-8 first:border-t-0 first:pt-0",
  peligro: "mt-2 border-[1.5px] border-[#b8241f] bg-[#b8241f]/[0.04] p-6",
} as const;

// Una sección de Ajustes, como en el maquetado: una etiqueta chica, el título, una línea de qué es
// y su contenido. Las secciones se separan con una línea; la "zona de peligro" va en un recuadro rojo.
export function Seccion({
  etiqueta,
  titulo,
  texto,
  tipo = "normal",
  children,
}: {
  etiqueta: string;
  titulo: string;
  texto?: string;
  tipo?: keyof typeof CAJAS;
  children: ReactNode;
}) {
  return (
    <section className={CAJAS[tipo]}>
      <span
        className={`font-mono text-[11px] tracking-widest uppercase ${tipo === "peligro" ? "text-[#b8241f]" : "text-naranja"}`}
      >
        {etiqueta}
      </span>
      <h2 className="mt-1 mb-2 font-display text-2xl leading-none uppercase">{titulo}</h2>
      {texto !== undefined && <p className="mb-5 text-xs text-ink/60">{texto}</p>}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
