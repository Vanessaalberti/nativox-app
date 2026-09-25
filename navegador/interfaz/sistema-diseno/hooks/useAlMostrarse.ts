import { useEffect, useRef } from "react";

// Las pestañas del panel se arman una vez y quedan ocultas: al volver a una, se actualiza lo que
// pudo haber cambiado en otra (por ejemplo, las salas nuevas), sin la pantalla de "cargando".
export function useAlMostrarse(visible: boolean, actualizar: () => void) {
  const yaSeMostro = useRef(visible);
  useEffect(() => {
    if (visible && yaSeMostro.current) actualizar();
    if (visible) yaSeMostro.current = true;
    // `actualizar` cambia en cada dibujo: solo importa el momento en que la pestaña se muestra.
  }, [visible]);
}
