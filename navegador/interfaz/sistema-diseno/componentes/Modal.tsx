import { useEffect, useId, type ReactNode } from "react";

// Una ventana sobre el contenido: se cierra con Escape, con un clic afuera o con "Cerrar". Bloquea
// el scroll de la página de atrás mientras está abierta.
export function Modal({
  etiqueta,
  titulo,
  alCerrar,
  children,
}: {
  etiqueta: string;
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/60 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idDelTitulo}
        className="relative my-auto w-full max-w-[560px] border-[1.5px] border-ink bg-canvas p-8"
      >
        <button
          type="button"
          onClick={alCerrar}
          className="absolute top-4 right-4 font-mono text-[10px] tracking-widest text-ink/60 uppercase hover:text-ink"
        >
          ✕ Cerrar
        </button>
        <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
          {etiqueta}
        </span>
        <h2 id={idDelTitulo} className="mt-2 mb-6 font-display text-4xl leading-[0.95] uppercase">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}
