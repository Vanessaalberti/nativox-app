import type { ReactNode } from "react";
import { Link } from "react-router";

const ANCHOS = {
  angosto: "max-w-[600px]",
  medio: "max-w-[1100px]",
  ancho: "max-w-[1280px]",
} as const;

// El marco de las pantallas de entrada (crear evento, ingresar): barra de arriba con la marca y,
// si ya hay evento, su nombre y logo; contenido centrado sobre la grilla; pie con "open source".
export function MarcoDeEntrada({
  children,
  ancho = "medio",
  evento,
  centrado = true,
}: {
  children: ReactNode;
  ancho?: keyof typeof ANCHOS;
  evento?: { nombre: string; logo: string | null } | null;
  centrado?: boolean;
}) {
  return (
    <div className="grilla-fondo relative flex min-h-screen flex-col bg-canvas text-ink">
      <header className="relative z-20 flex h-[60px] items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Nativox">
          <span className="grid size-5 grid-cols-2 gap-[2px]" aria-hidden>
            {[0, 1, 2, 3].map((cuadro) => (
              <span key={cuadro} className="size-[9px] bg-naranja" />
            ))}
          </span>
          <span className="font-display text-2xl leading-none font-bold tracking-wider">
            NATIVOX
          </span>
        </Link>
        {evento && (
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase">
            {evento.logo && <img src={evento.logo} alt="" className="size-6 object-contain" />}
            {evento.nombre}
          </span>
        )}
      </header>

      <main
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col px-8 py-12 ${ANCHOS[ancho]} ${centrado ? "items-center justify-center text-center" : "justify-center"}`}
      >
        {children}
      </main>

      <footer className="relative z-20 flex h-14 items-center px-8 font-mono">
        <span className="flex items-center gap-3">
          <span className="flex flex-col gap-[2px]" aria-hidden>
            <span className="size-3.5 bg-naranja" />
            <span className="size-3.5 bg-verde" />
          </span>
          <span className="text-[9px] leading-tight tracking-wider text-ink/70 uppercase">
            <span className="block">Open source</span>
            <span className="block">Tu propia instancia</span>
          </span>
        </span>
      </footer>
    </div>
  );
}
