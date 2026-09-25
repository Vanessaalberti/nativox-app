import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import "@navegador/interfaz/sistema-diseno/estilos.css";
import { enrutador } from "./enrutador";

const raiz = document.getElementById("raiz");
if (!raiz) {
  throw new Error("Falta el elemento #raiz en index.html");
}

createRoot(raiz).render(
  <StrictMode>
    <RouterProvider router={enrutador} />
  </StrictMode>,
);
