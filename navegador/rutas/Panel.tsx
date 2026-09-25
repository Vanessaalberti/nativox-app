import { GuardaDeAdministrador } from "@navegador/funcionalidades/acceso";
import { PanelDelAdministrador, ResumenDelEvento } from "@navegador/funcionalidades/paneles";
import { PanelDeSalas } from "@navegador/funcionalidades/salas";

// /panel y /panel/salas — solo el administrador, y solo cuando el evento ya existe.
export function Panel() {
  return (
    <GuardaDeAdministrador evento="con">
      <PanelDelAdministrador activa="resumen">
        {(datos) => <ResumenDelEvento {...datos} />}
      </PanelDelAdministrador>
    </GuardaDeAdministrador>
  );
}

export function PanelSalas() {
  return (
    <GuardaDeAdministrador evento="con">
      <PanelDelAdministrador activa="salas">{() => <PanelDeSalas />}</PanelDelAdministrador>
    </GuardaDeAdministrador>
  );
}
