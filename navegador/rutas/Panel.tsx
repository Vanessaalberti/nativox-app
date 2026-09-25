import { GuardaDeAdministrador } from "@navegador/funcionalidades/acceso";
import { PanelDelAdministrador } from "@navegador/funcionalidades/paneles";

// /panel — solo el administrador, y solo cuando el evento ya existe.
export function Panel() {
  return (
    <GuardaDeAdministrador evento="con">
      <PanelDelAdministrador />
    </GuardaDeAdministrador>
  );
}
