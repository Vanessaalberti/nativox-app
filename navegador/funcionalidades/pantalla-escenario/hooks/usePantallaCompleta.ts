import { useEffect, type RefObject } from "react";

// Pide pantalla completa al abrir. Si el navegador la bloquea, la vista igual ocupa toda la
// ventana (es `fixed inset-0`), así que no es un error. Esc o salir de la pantalla completa
// cierran la vista.
export function usePantallaCompleta(elemento: RefObject<HTMLElement | null>, alSalir: () => void) {
  useEffect(() => {
    const nodo = elemento.current;
    if (nodo && !document.fullscreenElement) {
      nodo.requestFullscreen().catch(() => {
        // Sin permiso para pantalla completa: se queda ocupando la ventana.
      });
    }

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") alSalir();
    };
    const alCambiarPantallaCompleta = () => {
      if (!document.fullscreenElement) alSalir();
    };
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("fullscreenchange", alCambiarPantallaCompleta);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("fullscreenchange", alCambiarPantallaCompleta);
      if (document.fullscreenElement) void document.exitFullscreen();
    };
  }, [elemento, alSalir]);
}
