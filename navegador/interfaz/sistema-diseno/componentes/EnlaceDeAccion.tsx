import type { ReactNode } from "react";
import { Link } from "react-router";

const ESTILO =
  "font-mono text-[11px] font-bold tracking-widest uppercase underline hover:text-naranja";

// Las acciones de un renglón de lista: un enlace a otra pantalla o, con `alClic`, un botón.
export function EnlaceDeAccion({
  a,
  alClic,
  children,
}: {
  a?: string;
  alClic?: () => void;
  children: ReactNode;
}) {
  if (a !== undefined) {
    return (
      <Link to={a} className={ESTILO}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={alClic} className={ESTILO}>
      {children}
    </button>
  );
}
