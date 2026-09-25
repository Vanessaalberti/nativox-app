import type { Idioma, Transcripcion } from "@compartido/contratos";
import { aSrt, aTexto, aVtt, type Segmento } from "@compartido/exportar-subtitulos";

export type Formato = "txt" | "srt" | "vtt";

// Los idiomas en los que hay texto: el original y los que llegaron traducidos.
export function idiomasDisponibles(segmentos: Transcripcion["segmentos"]): Idioma[] {
  const conTraduccion = new Set<Idioma>();
  for (const segmento of segmentos) {
    for (const idioma of ["es", "en", "pt"] as const) {
      if (segmento.traducciones[idioma] !== undefined) conTraduccion.add(idioma);
    }
  }
  return [...conTraduccion];
}

// El texto de cada frase en el idioma elegido ("original" o una traducción); lo que todavía no
// tiene esa traducción se deja afuera.
export function segmentosEn(
  segmentos: Transcripcion["segmentos"],
  idioma: "original" | Idioma,
): Segmento[] {
  return segmentos.flatMap((segmento) => {
    const texto = idioma === "original" ? segmento.original : segmento.traducciones[idioma];
    return texto === undefined ? [] : [{ inicio: segmento.inicio, fin: segmento.fin, texto }];
  });
}

export function exportar(
  segmentos: readonly Segmento[],
  formato: Formato,
  corrimientoSegundos: number,
): string {
  const opciones = { corrimientoSegundos };
  if (formato === "srt") return aSrt(segmentos, opciones);
  if (formato === "vtt") return aVtt(segmentos, opciones);
  return aTexto(segmentos, opciones);
}
