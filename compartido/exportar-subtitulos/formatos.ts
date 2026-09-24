import {
  formatearTiempo,
  partirEnRenglones,
  prepararSegmentos,
  type OpcionesExportar,
  type Segmento,
} from "./segmentos";

export function aSrt(segmentos: readonly Segmento[], opciones: OpcionesExportar = {}): string {
  return prepararSegmentos(segmentos, opciones)
    .map(
      (segmento, indice) =>
        `${String(indice + 1)}\n${rangoDeTiempo(segmento, ",")}\n${partirEnRenglones(segmento.texto)}\n`,
    )
    .join("\n");
}

export function aVtt(segmentos: readonly Segmento[], opciones: OpcionesExportar = {}): string {
  const bloques = prepararSegmentos(segmentos, opciones).map(
    (segmento) =>
      `${rangoDeTiempo(segmento, ".")}\n${partirEnRenglones(textoSeguroParaVtt(segmento.texto))}\n`,
  );
  return ["WEBVTT\n", ...bloques].join("\n");
}

// Un segmento por renglón, sin marcas de tiempo: para copiar la transcripción o leerla.
export function aTexto(segmentos: readonly Segmento[], opciones: OpcionesExportar = {}): string {
  const renglones = prepararSegmentos(segmentos, opciones).map((segmento) => segmento.texto);
  return renglones.length === 0 ? "" : `${renglones.join("\n")}\n`;
}

function rangoDeTiempo(segmento: Segmento, separador: "," | "."): string {
  return `${formatearTiempo(segmento.inicio, separador)} --> ${formatearTiempo(segmento.fin, separador)}`;
}

// En VTT "-->" dentro del texto corta el subtítulo, y "<" y "&" abren marcas.
function textoSeguroParaVtt(texto: string): string {
  return texto.replace(/-->/g, "→").replace(/&/g, "&amp;").replace(/</g, "&lt;");
}
