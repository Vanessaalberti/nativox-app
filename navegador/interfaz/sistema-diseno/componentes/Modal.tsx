import { useEffect, useId, type CSSProperties, type ReactNode } from "react";

const COLORES = { naranja: "text-naranja", verde: "text-verde", rojo: "text-[#b8241f]" } as const;

// Una ventana sobre el contenido: se cierra con Escape, con un clic afuera o con "Cerrar". Bloquea
// el scroll de la página de atrás mientras está abierta.
export function Modal({
  etiqueta,
  color = "naranja",
  ancho = 560,
  titulo,
  alCerrar,
  children,
}: {
  etiqueta: string;
  // El color de la etiqueta de arriba: el verde es el del staff; el rojo, el de lo que borra.
  color?: keyof typeof COLORES;
  ancho?: number;
  titulo: ReactNode;
  alCerrar: () => void;
  children: ReactNode;
}) {
  const idDelTitulo = useId();

  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") alCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflowAnterior;
    };
  }, [alCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/50 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idDelTitulo}
        style={{ "--ancho": `${String(ancho)}px` } as CSSProperties}
        className="relative my-auto w-full max-w-[var(--ancho)] border-[1.5px] border-[#443d30] bg-canvas p-7"
      >
        <button
          type="button"
          onClick={alCerrar}
          className="absolute top-5 right-5 font-mono text-xs tracking-widest text-ink/40 uppercase hover:text-ink"
        >
          ✕ Cerrar
        </button>
        <span className={`font-mono text-[11px] tracking-widest uppercase ${COLORES[color]}`}>
          {etiqueta}
        </span>
        <h2 id={idDelTitulo} className="mt-2 mb-6 font-display text-3xl leading-[0.95] uppercase">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}
