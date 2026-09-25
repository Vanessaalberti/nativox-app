import type { Idioma, Linea } from "@compartido/contratos";
import { LineaSubtitulo, type TamanoSubtitulo } from "./LineaSubtitulo";

export interface PropiedadesVista {
  lineas: readonly Linea[];
  idioma: Idioma;
  idiomaOriginal: Idioma;
  mostrarOriginal: boolean;
  tamano: TamanoSubtitulo;
  // Cuántas de las últimas líneas se ven (la pantalla del escenario usa 2).
  cantidad: number;
  textoVacio: string;
}

// Las últimas N líneas con texto: la nueva abajo y las anteriores atenuadas. Recibe las líneas ya
// armadas; no se conecta a nada.
export function VistaSubtitulos({ lineas, cantidad, textoVacio, ...estilo }: PropiedadesVista) {
  const visibles = lineas.filter((linea) => linea.original.trim() !== "").slice(-cantidad);

  if (visibles.length === 0) {
    return <p className="text-center font-sans text-2xl text-canvas/30">{textoVacio}</p>;
  }
  return (
    <div className="flex flex-col gap-6 text-center">
      {visibles.map((linea, indice) => (
        <LineaSubtitulo
          key={linea.id}
          linea={linea}
          atenuada={indice < visibles.length - 1}
          {...estilo}
        />
      ))}
    </div>
  );
}
