import type { ReactNode } from "react";

// Una sección de Ajustes: título, una línea de qué es y su contenido.
export function Seccion({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-[1.5px] border-ink/25 bg-canvas p-6">
      <div>
        <h2 className="font-display text-4xl leading-none uppercase">{titulo}</h2>
        {texto !== undefined && <p className="mt-2 max-w-[760px] text-sm text-ink/70">{texto}</p>}
      </div>
      {children}
    </section>
  );
}
