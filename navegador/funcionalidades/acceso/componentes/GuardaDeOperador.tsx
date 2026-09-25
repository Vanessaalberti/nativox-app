import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { ConEstadoDeLaInstancia } from "./ConEstadoDeLaInstancia";

// Deja pasar solo a quien entró como operador; al administrador lo manda a su panel y a los demás,
// a la entrada.
export function GuardaDeOperador({ children }: { children: ReactNode }) {
  return (
    <ConEstadoDeLaInstancia>
      {(estado) => {
        if (estado.sesion?.rol === "operador") return children;
        return <Navigate to={estado.sesion ? "/panel" : "/entrada"} replace />;
      }}
    </ConEstadoDeLaInstancia>
  );
}
