import { useCallback, useEffect, useRef, useState } from "react";

// Los controles aparecen al mover el mouse y se esconden a los 3 s: el público solo ve subtítulos.
const MS_HASTA_ESCONDER = 3000;

export function useControlesQueSeEsconden() {
  const [visibles, setVisibles] = useState(true);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = useCallback(() => {
    setVisibles(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setVisibles(false);
    }, MS_HASTA_ESCONDER);
  }, []);

  useEffect(() => {
    mostrar();
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [mostrar]);

  return { visibles, mostrar };
}
