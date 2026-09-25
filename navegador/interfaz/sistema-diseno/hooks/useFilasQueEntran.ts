import { useLayoutEffect, useState, type RefObject } from "react";

const MINIMO_DE_FILAS = 4;

// Cuántas filas de una tabla entran en el alto disponible, para paginar sin barra de
// desplazamiento. Se calcula con un alto de fila estimado y después se corrige con lo que de
// verdad mide la tabla: si una fila ocupa más (texto que se parte en dos renglones), se sacan
// filas hasta que entre completa. Se recalcula cuando cambia el tamaño de la ventana.
export function useFilasQueEntran(
  contenedor: RefObject<HTMLElement | null>,
  altoDeFila: number,
  altoDeLaCabecera: number,
  activo: boolean,
): number {
  const [filas, setFilas] = useState(8);

  useLayoutEffect(() => {
    const elemento = contenedor.current;
    if (!elemento || !activo) return;
    const medir = () =>
      setFilas(
        Math.max(
          MINIMO_DE_FILAS,
          Math.floor((elemento.clientHeight - altoDeLaCabecera) / altoDeFila),
        ),
      );
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [contenedor, altoDeFila, altoDeLaCabecera, activo]);

  // La corrección corre después de cada dibujo, hasta que la tabla entra.
  useLayoutEffect(() => {
    const elemento = contenedor.current;
    const tabla = elemento?.querySelector("table");
    if (
      elemento &&
      tabla &&
      activo &&
      tabla.scrollHeight > elemento.clientHeight + 0.5 &&
      filas > 1
    ) {
      setFilas(filas - 1);
    }
  });

  return filas;
}
