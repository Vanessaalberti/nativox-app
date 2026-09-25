import type { ReactNode } from "react";

// Una nota destacada (con rombo) o un error. Los errores se anuncian solos a los lectores de pantalla.
export function Aviso({
  tipo = "nota",
  children,
}: {
  tipo?: "nota" | "error";
  children: ReactNode;
}) {
  if (tipo === "error") {
    return (
      <p role="alert" className="font-mono text-xs text-[#b8241f]">
        {children}
      </p>
    );
  }
  return (
    <div className="flex items-start gap-3 border-[1.5px] border-ink/25 bg-canvas px-4 py-3.5">
      <span className="mt-0.5 font-mono text-sm leading-none text-verde" aria-hidden>
        ◆
      </span>
      <p className="text-xs leading-relaxed text-ink/70">{children}</p>
    </div>
  );
}
