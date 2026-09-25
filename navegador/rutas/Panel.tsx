import { useParams } from "react-router";
import { GuardaDeAdministrador, GuardaDeOperador } from "@navegador/funcionalidades/acceso";
import { PanelDeAjustes } from "@navegador/funcionalidades/ajustes";
import { PanelDeOperadores } from "@navegador/funcionalidades/operadores";
import {
  PanelDelAdministrador,
  PanelDelOperador,
  ResumenDelEvento,
  pestanaDeLaRuta,
} from "@navegador/funcionalidades/paneles";
import { PanelDeProduccion } from "@navegador/funcionalidades/produccion";
import { PanelDeSalas } from "@navegador/funcionalidades/salas";

// /panel (y /panel/salas, /panel/staff…) — solo el administrador, y solo cuando el evento ya
// existe. Es una sola página: las pestañas cambian lo que se ve sin cambiar de ruta, y el segmento
// de la URL solo decide con cuál se abre.
export function Panel() {
  const { pestana } = useParams();

  return (
    <GuardaDeAdministrador evento="con">
      <PanelDelAdministrador
        inicial={pestanaDeLaRuta(pestana)}
        paneles={{
          dashboard: ({ evento, visible, irA }) => (
            <ResumenDelEvento evento={evento} visible={visible} alAbrirSalas={() => irA("salas")} />
          ),
          salas: ({ evento, visible }) => (
            <PanelDeSalas conEquipo={evento.tipo === "roles-separados"} visible={visible} />
          ),
          staff: ({ visible, irA }) => (
            <PanelDeOperadores visible={visible} alAbrirSalas={() => irA("salas")} />
          ),
          produccion: ({ visible }) => <PanelDeProduccion visible={visible} />,
          ajustes: ({ evento, email, visible }) => (
            <PanelDeAjustes evento={evento} email={email} visible={visible} />
          ),
        }}
      />
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
