import { useParams } from "react-router";
import { GuardaDeSesion } from "@navegador/funcionalidades/acceso";
import { CalendarioDeLaSala } from "@navegador/funcionalidades/agenda";

// /sala/:id/calendario — la agenda de una sala. El administrador la edita; un operador la ve (el
// servidor le responde solo si la sala es suya).
export function Calendario() {
  const { id = "" } = useParams();
  return (
    <GuardaDeSesion>
      {(rol) => <CalendarioDeLaSala salaId={id} soloLectura={rol === "operador"} />}
    </GuardaDeSesion>
  );
}
