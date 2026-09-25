import { Link, useNavigate } from "react-router";
import { salir } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Boton } from "@navegador/interfaz/sistema-diseno";

// /sin-acceso: la persona entró pero esta pantalla no es de su rol o de sus salas.
export function SinAcceso() {
  const navegar = useNavigate();

  return (
    <MarcoDeEntrada>
      <span className="font-display text-8xl leading-none text-naranja">403</span>
      <span className="mt-2 font-mono text-[11px] tracking-widest text-ink/60 uppercase">
        Acceso restringido
      </span>
      <h1 className="mt-3 mb-5 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase">
        No tenés acceso a esta sala
      </h1>
      <p className="mb-10 max-w-[560px] text-base text-ink/80">
        Tu código te da acceso solo a las salas que tu administrador te asignó, y esta no es una de
        ellas. Si creés que es un error, pedile que te la sume desde su panel.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="border-[3px] border-[#b8241f] bg-naranja px-6 py-3.5 font-mono text-sm font-bold tracking-widest uppercase hover:bg-[#e67b00]"
        >
          ← Ver mis salas
        </Link>
        <Boton
          variante="secundario"
          onClick={() => {
            void salir().then(() => navegar("/entrada", { replace: true }));
          }}
        >
          Salir
        </Boton>
      </div>
    </MarcoDeEntrada>
  );
}
