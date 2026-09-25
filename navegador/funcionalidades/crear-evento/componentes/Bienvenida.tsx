import { Link } from "react-router";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";

// Dónde se cuenta qué es Nativox: la portada pública del proyecto (no es parte de esta instancia).
const DIRECCION_DE_LA_PORTADA = "https://nativox-landing.vanessaalbertii01.workers.dev/";

// "/" en una instancia recién desplegada: todavía no hay administrador ni evento.
export function Bienvenida() {
  return (
    <MarcoDeEntrada>
      <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
        00 — Empezar
      </span>
      <h1 className="mt-3 mb-5 font-display text-6xl leading-[0.95] font-extrabold tracking-tight uppercase md:text-7xl">
        Tu conferencia,
        <br />
        traducida en vivo.
      </h1>
      <p className="mb-14 max-w-[560px] text-lg text-ink/80">
        Esta instancia de Nativox está lista para usarse. Elegí qué querés hacer.
      </p>
      <div className="grid w-full max-w-[880px] gap-6 md:grid-cols-2 md:gap-8">
        <Link
          to="/crear-evento"
          className="group flex flex-col items-start border-[3px] border-[#b8241f] bg-naranja p-8 text-left shadow-md transition-colors hover:bg-[#e67b00]"
        >
          <span className="mb-6 font-mono text-[11px] tracking-widest text-ink/70 uppercase">
            01
          </span>
          <span className="mb-3 font-display text-4xl leading-[0.95] uppercase">
            Crear
            <br />
            evento
          </span>
          <span className="mb-10 text-sm text-ink/80">
            Configurá tu evento, elegí cómo corre la IA y arrancá tu primera sala en minutos.
          </span>
          <span className="mt-auto flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase">
            Empezar{" "}
            <span className="transition-transform group-hover:translate-x-1" aria-hidden>
              →
            </span>
          </span>
        </Link>
        <a
          href={DIRECCION_DE_LA_PORTADA}
          className="group flex flex-col items-start border-[1.5px] border-ink/30 p-8 text-left transition-colors hover:border-ink"
        >
          <span className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase">
            02
          </span>
          <span className="mb-3 font-display text-4xl leading-[0.95] uppercase">
            ¿Qué es
            <br />
            Nativox?
          </span>
          <span className="mb-10 text-sm text-ink/70">
            Todavía no lo probaste. Mirá de qué se trata antes de crear nada.
          </span>
          <span className="mt-auto flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-naranja uppercase">
            Ver más{" "}
            <span className="transition-transform group-hover:translate-x-1" aria-hidden>
              →
            </span>
          </span>
        </a>
      </div>
    </MarcoDeEntrada>
  );
}
