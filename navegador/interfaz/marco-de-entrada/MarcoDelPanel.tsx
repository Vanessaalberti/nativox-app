import type { ReactNode } from "react";
import { MarcaDeNativox, SelloOpenSource } from "./piezas";

const PUNTOS = Array.from({ length: 18 }, (_, indice) => indice);

// Los adornos de fondo del maquetado: cruces, coordenadas, la matriz de puntos y el bloque de
// píxeles. Solo se ven en pantallas grandes y no reciben clics.
function Adornos({ rotulo }: { rotulo: [string, string] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
      <span className="absolute top-[150px] right-[16%] font-mono text-sm leading-none font-bold text-naranja select-none">
        +
      </span>
      <span className="absolute top-[420px] left-[9%] font-mono text-sm leading-none font-bold text-ink/30 select-none">
        +
      </span>
      <span className="absolute right-[10%] bottom-[130px] font-mono text-sm leading-none font-bold text-ink/30 select-none">
        +
      </span>
      <span className="absolute top-[172px] left-[24px] font-mono text-[11px] tracking-wider text-ink/40">
        00
      </span>
      <div className="absolute top-[172px] right-[24px] flex flex-col items-end font-mono text-[10px] leading-snug text-ink/35">
        <span>{rotulo[0]}</span>
        <span>{rotulo[1]}</span>
      </div>
      <div className="absolute top-[92px] right-[110px] grid grid-cols-6 gap-2.5">
        {PUNTOS.map((punto) => (
          <span key={punto} className="size-1 rounded-full bg-ink/25" />
        ))}
      </div>
      <div className="absolute bottom-[64px] left-[40px] grid grid-cols-4 gap-[2px]">
        {["n", "n", "", "", "n", "n", "", "", "", "v", "v", "", "", "v", "v", ""].map(
          (color, indice) => (
            <span
              key={indice}
              className={`size-3 ${color === "n" ? "bg-naranja" : color === "v" ? "bg-verde" : ""}`}
            />
          ),
        )}
      </div>
    </div>
  );
}

// El marco de los paneles, como el maquetado: ocupa todo el alto de la ventana (barra arriba, pie
// abajo) y solo el contenido del medio se desplaza. Con `libre` el contenido ocupa todo el ancho y
// el alto del medio (el calendario arma sus propias columnas); si no, va en una columna centrada.
export function MarcoDelPanel({
  acciones,
  rotulo,
  alSalir,
  junto,
  libre = false,
  children,
}: {
  // Lo que va a la izquierda de "Salir": la insignia del rol, o un enlace.
  acciones: ReactNode;
  rotulo: [string, string];
  // Sin esto no hay "Salir" (las pantallas que se abren desde un panel vuelven con su propio enlace).
  alSalir?: () => void;
  // Lo que va al lado de la marca, como "← Volver a Salas".
  junto?: ReactNode;
  libre?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grilla-fondo relative flex h-screen w-full flex-col overflow-hidden bg-canvas text-ink">
      <Adornos rotulo={rotulo} />

      <header className="relative z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-[#443d30]/20 px-8">
        <div className="flex items-center gap-6">
          <MarcaDeNativox />
          {junto}
        </div>
        <div className="flex items-center gap-4">
          {acciones}
          {alSalir && (
            <button
              type="button"
              onClick={alSalir}
              className="font-mono text-[11px] tracking-widest text-ink/50 uppercase transition-colors hover:text-ink"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      {libre ? (
        <main className="relative z-10 flex w-full flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {children}
        </main>
      ) : (
        <main className="relative z-10 w-full flex-1 overflow-y-auto">
          <div className="mx-auto flex h-full min-h-fit max-w-[1680px] flex-col px-8 py-14 lg:px-14">
            {children}
          </div>
        </main>
      )}

      <footer className="relative z-10 flex h-14 shrink-0 items-center border-t border-[#443d30]/20 px-8 font-mono">
        <SelloOpenSource />
      </footer>
    </div>
  );
}
