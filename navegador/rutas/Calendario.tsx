import { useParams } from "react-router";
import { GuardaDeAdministrador } from "@navegador/funcionalidades/acceso";
import { CalendarioDeLaSala } from "@navegador/funcionalidades/agenda";

// /sala/:id/calendario — la agenda de una sala; solo el administrador.
export function Calendario() {
  const { id = "" } = useParams();
  return (
    <GuardaDeAdministrador evento="con">
      <CalendarioDeLaSala salaId={id} />
    </GuardaDeAdministrador>
  );
}
