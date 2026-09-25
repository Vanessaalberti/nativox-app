import { createBrowserRouter } from "react-router";
import { ControlSala } from "@navegador/rutas/ControlSala";
import { Inicio } from "@navegador/rutas/Inicio";

export const enrutador = createBrowserRouter([
  { path: "/", element: <Inicio /> },
  { path: "/sala/:id/control", element: <ControlSala /> },
]);
