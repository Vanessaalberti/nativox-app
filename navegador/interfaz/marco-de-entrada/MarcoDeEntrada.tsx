import type { ReactNode } from "react";
import { MarcaDeNativox, SelloOpenSource } from "./piezas";

// "angosto" es para los formularios cortos (ingresar, crear la cuenta); el resto ocupa todo el ancho,
// como la portada y "Probar".
const ANCHOS = {
  angosto: "max-w-[880px]",
  medio: "max-w-[1680px]",
  ancho: "max-w-[1680px]",
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
        <MarcaDeNativox />
        {evento && (
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase">
            {evento.logo && <img src={evento.logo} alt="" className="size-6 object-contain" />}
            {evento.nombre}
          </span>
        )}
      </header>

      <main
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col px-5 py-12 md:px-8 ${ANCHOS[ancho]} ${centrado ? "items-center justify-center text-center" : "justify-center"}`}
      >
        {children}
      </main>

      <footer className="relative z-20 flex h-14 items-center px-8 font-mono">
        <SelloOpenSource />
      </footer>
    </div>
  );
}
