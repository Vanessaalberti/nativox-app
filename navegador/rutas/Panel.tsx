import { GuardaDeAdministrador, GuardaDeOperador } from "@navegador/funcionalidades/acceso";
import { PanelDeAjustes } from "@navegador/funcionalidades/ajustes";
import { PanelDeOperadores } from "@navegador/funcionalidades/operadores";
import {
  PanelDelAdministrador,
  PanelDelOperador,
  ResumenDelEvento,
} from "@navegador/funcionalidades/paneles";
import { PanelDeProduccion } from "@navegador/funcionalidades/produccion";
import { PanelDeSalas } from "@navegador/funcionalidades/salas";

// /panel, /panel/salas y /panel/operadores — solo el administrador, y solo cuando el evento ya
// existe.
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

export function PanelOperadores() {
  return (
    <GuardaDeAdministrador evento="con">
      <PanelDelAdministrador activa="operadores">
        {() => <PanelDeOperadores />}
      </PanelDelAdministrador>
    </GuardaDeAdministrador>
  );
}

// /operador — las salas de quien entró con un código de invitación.
export function PanelOperador() {
  return (
    <GuardaDeOperador>
      <PanelDelOperador />
    </GuardaDeOperador>
  );
}

export function PanelProduccion() {
  return (
    <GuardaDeAdministrador evento="con">
      <PanelDelAdministrador activa="produccion">
        {() => <PanelDeProduccion />}
      </PanelDelAdministrador>
    </GuardaDeAdministrador>
  );
}

export function PanelAjustes() {
  return (
    <GuardaDeAdministrador evento="con">
      <PanelDelAdministrador activa="ajustes">
        {(datos) => <PanelDeAjustes {...datos} />}
      </PanelDelAdministrador>
    </GuardaDeAdministrador>
  );
}
