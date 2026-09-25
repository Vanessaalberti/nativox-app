import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { ConEstadoDeLaInstancia } from "./ConEstadoDeLaInstancia";

// "/": decide a dónde va cada persona según lo que falta en la instancia.
//   sin administrador          → la bienvenida (crear evento)
//   administrador, sin evento  → seguir el asistente (o ingresar, si perdió la sesión)
//   con evento                 → el panel (si es el administrador) o la entrada por rol
export function Arranque({ bienvenida }: { bienvenida: ReactNode }) {
  return (
    <ConEstadoDeLaInstancia>
      {(estado) => {
        const esAdministrador = estado.sesion?.rol === "administrador";
        if (!estado.hayAdministrador) return bienvenida;
        if (estado.hayEvento && estado.sesion?.rol === "operador") {
          return <Navigate to="/operador" replace />;
        }
        if (!estado.hayEvento) {
          return (
            <Navigate to={esAdministrador ? "/crear-evento/evento" : "/entrada/admin"} replace />
          );
        }
        return <Navigate to={esAdministrador ? "/panel" : "/entrada"} replace />;
      }}
    </ConEstadoDeLaInstancia>
  );
}
