import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { ConEstadoDeLaInstancia } from "./ConEstadoDeLaInstancia";

// Deja pasar a quien tiene sesión, sea administrador u operador, y le dice cuál es su rol. Sin
// sesión, manda a la entrada. La autorización de cada sala la hace el servidor.
export function GuardaDeSesion({
  children,
}: {
  children: (rol: "administrador" | "operador") => ReactNode;
}) {
  return (
    <ConEstadoDeLaInstancia>
      {(estado) => {
        if (!estado.sesion) return <Navigate to="/entrada" replace />;
        return children(estado.sesion.rol);
      }}
    </ConEstadoDeLaInstancia>
  );
}
