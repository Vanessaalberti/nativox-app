import type { Idioma, Linea } from "@compartido/contratos";

export type TamanoSubtitulo = "S" | "M" | "L";

// Píxeles [original, traducción] a 1920 de ancho: el original chico arriba, la traducción grande.
const TAMANOS: Record<TamanoSubtitulo, [number, number]> = {
  S: [22, 40],
  M: [28, 56],
  L: [36, 72],
};

export interface PropiedadesLinea {
  linea: Linea;
  // Idioma que se muestra en grande. Si es el original, se muestra solo el original.
  idioma: Idioma;
  idiomaOriginal: Idioma;
  mostrarOriginal: boolean;
  tamano: TamanoSubtitulo;
  atenuada?: boolean;
}

// Mientras la frase no se confirma, el original va en gris y la traducción como "…"; al
// confirmarse se completan los dos.
export function LineaSubtitulo({
  linea,
  idioma,
  idiomaOriginal,
  mostrarOriginal,
  tamano,
  atenuada = false,
}: PropiedadesLinea) {
  const [chico, grande] = TAMANOS[tamano];
  const esOriginal = idioma === idiomaOriginal;
  const traduccion = esOriginal ? linea.original : linea.traducciones[idioma];
  const principal = linea.provisoria && !esOriginal ? "…" : (traduccion ?? "…");

  return (
    <div className={`flex flex-col gap-1 transition-opacity ${atenuada ? "opacity-45" : ""}`}>
      {mostrarOriginal && !esOriginal && (
        <p
          className={`font-sans leading-snug ${linea.provisoria ? "text-canvas/40" : "text-canvas/75"}`}
          style={{ fontSize: `${String(chico)}px` }}
        >
          {linea.original}
        </p>
      )}
      <p
        className={`font-sans font-semibold leading-tight ${linea.provisoria ? "text-canvas/45" : "text-canvas"}`}
        style={{ fontSize: `${String(grande)}px` }}
      >
        {principal}
      </p>
    </div>
  );
}
