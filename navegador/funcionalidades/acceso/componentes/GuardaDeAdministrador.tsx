import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { ConEstadoDeLaInstancia } from "./ConEstadoDeLaInstancia";

// Deja pasar solo a quien es el administrador de la instancia; a los demás los manda a ingresar.
// La autorización real la hace el servidor en cada pedido: esto solo evita mostrar una pantalla
// que no le corresponde.
//   evento "con"    → hace falta que el evento ya exista (el panel); si no, sigue el asistente
//   evento "sin"    → hace falta que todavía no exista (el último paso del asistente)
export function GuardaDeAdministrador({
  evento,
  children,
}: {
  evento: "con" | "sin";
  children: ReactNode;
}) {
  return (
    <ConEstadoDeLaInstancia>
      {(estado) => {
        if (estado.sesion?.rol !== "administrador") return <Navigate to="/entrada/admin" replace />;
        if (evento === "con" && !estado.hayEvento) {
          return <Navigate to="/crear-evento/evento" replace />;
        }
        if (evento === "sin" && estado.hayEvento) return <Navigate to="/panel" replace />;
        return children;
      }}
    </ConEstadoDeLaInstancia>
  );
}
