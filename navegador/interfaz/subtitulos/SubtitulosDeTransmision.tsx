import type { EstiloSalida, Idioma, Linea } from "@compartido/contratos";

// El tamaño se pide en píxeles sobre 1920 de ancho (vMix y OBS cargan la página a 1920 × 1080) y
// se convierte a `vw`, así el texto escala igual si la fuente se carga a otro tamaño.
const ANCHO_DE_REFERENCIA_PX = 1920;

// `vw` en la página de transmisión; `cqw` en una vista previa, que se mide contra su recuadro.
const aUnidad = (pixeles: number, unidad: "vw" | "cqw") =>
  `${((pixeles / ANCHO_DE_REFERENCIA_PX) * 100).toFixed(3)}${unidad}`;

// Los subtítulos sobre fondo transparente, para meterlos en vMix u OBS. Recibe las líneas ya
// armadas y el estilo elegido; no se conecta a nada.
export function SubtitulosDeTransmision({
  lineas,
  idiomaOriginal,
  estilo,
  vistaPrevia = false,
}: {
  lineas: readonly Linea[];
  idiomaOriginal: Idioma;
  estilo: EstiloSalida;
  // Dentro de un recuadro (el configurador) en vez de ocupar toda la página.
  vistaPrevia?: boolean;
}) {
  const unidad = vistaPrevia ? "cqw" : "vw";
  const alVw = (pixeles: number) => aUnidad(pixeles, unidad);
  // La sombra oscura es lo que hace legible el texto blanco sobre cualquier imagen de fondo.
  const sombra = `0 0 ${alVw(10)} rgba(0,0,0,0.95), 0 ${alVw(2)} ${alVw(6)} rgba(0,0,0,0.95)`;
  const visibles = lineas.filter((linea) => linea.original.trim() !== "").slice(-estilo.lineas);
  const esOriginal = estilo.idioma === idiomaOriginal;

  return (
    <div
      className={`${vistaPrevia ? "absolute" : "fixed"} inset-0 flex flex-col overflow-hidden ${estilo.posicion === "abajo" ? "justify-end" : "justify-start"}`}
      style={{ padding: `${alVw(58)} ${alVw(96)}` }}
    >
      <div className="flex flex-col items-center text-center">
        {visibles.map((linea, indice) => {
          const traducida = esOriginal ? linea.original : linea.traducciones[estilo.idioma];
          // Mientras una traducción no está lista se ve el original, en vez de un hueco.
          const principal = traducida ?? linea.original;
          const vieja = indice < visibles.length - 1;
          return (
            <div
              key={linea.id}
              style={{ gap: alVw(4), marginTop: alVw(12) }}
              className={`flex flex-col items-center ${vieja ? "opacity-70" : ""}`}
            >
              {estilo.mostrarOriginal && !esOriginal && (
                <p
                  className="font-sans leading-snug text-white/80"
                  style={{ fontSize: alVw(estilo.tamanoLetra * 0.55), textShadow: sombra }}
                >
                  {linea.original}
                </p>
              )}
              <p
                className={`font-sans leading-tight font-semibold text-white ${linea.provisoria ? "opacity-80" : ""}`}
                style={{ fontSize: alVw(estilo.tamanoLetra), textShadow: sombra }}
              >
                {principal}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
