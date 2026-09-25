import { createBrowserRouter } from "react-router";
import { ControlSala } from "@navegador/rutas/ControlSala";
import {
  EntradaAdmin,
  EntradaOperadorCodigo,
  EntradaRol,
  PaginaSinAcceso,
} from "@navegador/rutas/Entradas";
import { Inicio } from "@navegador/rutas/Inicio";
import { Panel } from "@navegador/rutas/Panel";
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
  { path: "/sala/:id/control", element: <ControlSala /> },
]);
