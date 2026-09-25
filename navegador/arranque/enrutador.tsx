import { createBrowserRouter } from "react-router";
import {
  AccionDeAviso,
  Audiencia,
  Monitoreo,
  PantallaDeSala,
  Subtitulos,
  TransmisionDeSala,
  TransmisionDeSalida,
} from "@navegador/rutas/Audiencia";
import { Calendario } from "@navegador/rutas/Calendario";
import { ControlSala } from "@navegador/rutas/ControlSala";
import {
  EntradaAdmin,
  EntradaOperadorCodigo,
  EntradaRol,
  PaginaSinAcceso,
} from "@navegador/rutas/Entradas";
import { Inicio } from "@navegador/rutas/Inicio";
import { Panel, PanelOperador } from "@navegador/rutas/Panel";
import { PasoCuenta, PasoEvento, PasoTipo } from "@navegador/rutas/PasoDelAsistente";

export const enrutador = createBrowserRouter([
  { path: "/", element: <Inicio /> },
  { path: "/crear-evento", element: <PasoTipo /> },
  { path: "/crear-evento/cuenta", element: <PasoCuenta /> },
  { path: "/crear-evento/evento", element: <PasoEvento /> },
  { path: "/entrada", element: <EntradaRol /> },
  { path: "/entrada/admin", element: <EntradaAdmin /> },
  { path: "/entrada/operador", element: <EntradaOperadorCodigo /> },
  { path: "/sin-acceso", element: <PaginaSinAcceso /> },
  { path: "/panel", element: <Panel /> },
  { path: "/panel/:pestana", element: <Panel /> },
  { path: "/operador", element: <PanelOperador /> },
  { path: "/audiencia", element: <Audiencia /> },
  { path: "/accion/:token", element: <AccionDeAviso /> },
  { path: "/sala/:id/pantalla", element: <PantallaDeSala /> },
  { path: "/sala/:id/transmision", element: <TransmisionDeSala /> },
  { path: "/sala/:id/subtitulos", element: <Subtitulos /> },
  { path: "/sala/:id/monitoreo", element: <Monitoreo /> },
  { path: "/produccion/:salida", element: <TransmisionDeSalida /> },
  { path: "/sala/:id/calendario", element: <Calendario /> },
  { path: "/sala/:id/control", element: <ControlSala /> },
]);
