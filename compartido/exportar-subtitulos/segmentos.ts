export interface Segmento {
  // Segundos desde el comienzo de la grabación.
  inicio: number;
  fin: number;
  texto: string;
}

export interface OpcionesExportar {
  // Segundos que se suman a cada marca (negativo adelanta), para alinear con el video de
  // YouTube, que casi nunca empieza justo con la charla.
  corrimientoSegundos?: number;
}

// Un subtítulo legible entra en ~42 caracteres por renglón (la pauta habitual de subtitulado).
const CARACTERES_POR_RENGLON = 42;

// Aplica el corrimiento, descarta lo que queda antes de 0 o sin texto, y ordena por inicio.
export function prepararSegmentos(
  segmentos: readonly Segmento[],
  { corrimientoSegundos = 0 }: OpcionesExportar,
): Segmento[] {
  return segmentos
    .map((segmento) => ({
      inicio: Math.max(0, segmento.inicio + corrimientoSegundos),
      fin: segmento.fin + corrimientoSegundos,
      texto: segmento.texto.trim(),
    }))
    .filter((segmento) => segmento.fin > 0 && segmento.texto !== "")
    .sort((a, b) => a.inicio - b.inicio);
}

// "HH:MM:SS" + separador + milisegundos. SRT usa coma y VTT, punto.
export function formatearTiempo(segundos: number, separador: "," | "."): string {
  const milisegundosTotales = Math.round(segundos * 1000);
  const horas = Math.floor(milisegundosTotales / 3_600_000);
  const minutos = Math.floor(milisegundosTotales / 60_000) % 60;
  const segundosEnteros = Math.floor(milisegundosTotales / 1000) % 60;
  const milisegundos = milisegundosTotales % 1000;

  const dos = (numero: number) => String(numero).padStart(2, "0");
  return `${dos(horas)}:${dos(minutos)}:${dos(segundosEnteros)}${separador}${String(milisegundos).padStart(3, "0")}`;
}

export function partirEnRenglones(texto: string): string {
  const renglones: string[] = [];
  let actual = "";

  for (const palabra of texto.split(/\s+/)) {
    if (actual !== "" && actual.length + 1 + palabra.length > CARACTERES_POR_RENGLON) {
      renglones.push(actual);
      actual = palabra;
    } else {
      actual = actual === "" ? palabra : `${actual} ${palabra}`;
    }
  }
  if (actual !== "") renglones.push(actual);
  return renglones.join("\n");
}
