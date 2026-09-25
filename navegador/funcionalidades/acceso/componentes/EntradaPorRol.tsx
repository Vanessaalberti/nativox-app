import { Link } from "react-router";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { useEstadoDeLaInstancia } from "../hooks/useEstadoDeLaInstancia";

const OPCIONES = [
  {
    numero: "01",
    titulo: "Admin",
    texto: "Gestioná salas, sumá gente a tu equipo y mirá cómo van todas las sesiones.",
    ruta: "/entrada/admin",
  },
  {
    numero: "02",
    titulo: "Operador",
    texto: "Tenés un código de invitación de tu organización. Entrá directo a tus salas asignadas.",
    ruta: "/entrada/operador",
  },
];

// /entrada: en una instancia que ya tiene evento, cada persona elige cómo entra.
export function EntradaPorRol() {
  const { carga } = useEstadoDeLaInstancia();
  const evento = carga.fase === "lista" ? carga.estado.evento : null;

  return (
    <MarcoDeEntrada evento={evento}>
      <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
        Bienvenido de nuevo
      </span>
      <h1 className="mt-3 mb-5 font-display text-6xl leading-[0.95] font-extrabold tracking-tight uppercase">
        ¿Cómo entrás?
      </h1>
      <p className="mb-12 max-w-[560px] text-lg text-ink/80">
        Esta es tu instancia de Nativox. Elegí tu rol para continuar.
      </p>
      <div className="grid w-full max-w-[880px] gap-6 md:grid-cols-2 md:gap-8">
        {OPCIONES.map((opcion) => (
          <Link
            key={opcion.ruta}
            to={opcion.ruta}
            className="group flex flex-col items-start border-[1.5px] border-ink/30 p-8 text-left transition-colors hover:border-ink"
          >
            <span className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase">
              {opcion.numero}
            </span>
            <span className="mb-3 font-display text-4xl leading-[0.95] uppercase">
              {opcion.titulo}
            </span>
            <span className="mb-10 text-sm text-ink/70">{opcion.texto}</span>
            <span className="mt-auto flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-naranja uppercase">
              Entrar{" "}
              <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </MarcoDeEntrada>
  );
}
