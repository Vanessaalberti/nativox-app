import { distanciaEdicion } from "@compartido/distancia-edicion";
import type { EntradaGlosario } from "./leer";
import { estanJuntas, normalizar, separarPalabras, type Palabra } from "./texto";

export type TipoCoincidencia = "exacta" | "sigla-con-barra" | "intercalada" | "parecida";

export interface Coincidencia {
  desde: number;
  hasta: number;
  entrada: EntradaGlosario;
}

interface Contexto {
  texto: string;
  palabras: Palabra[];
}

type Buscador = (contexto: Contexto, desde: number, entrada: EntradaGlosario) => number | null;

// Conectores con los que se dice en voz alta una sigla con barra: "CI y CD", "CI and CD".
const CONECTORES = new Set(["y", "e", "and", "barra", "slash"]);
const MAXIMO_INTERCALADAS = 2;
const LARGO_MAXIMO_INTERCALADA = 4;
const LARGO_MINIMO_PARECIDO = 5;

// Si dos coincidencias se pisan, gana la más larga ("API key" sobre "API") y, a igual largo,
// la más segura (una exacta antes que una parecida).
export function buscarCoincidencias(
  texto: string,
  entradas: readonly EntradaGlosario[],
  tipos: readonly TipoCoincidencia[],
): { palabras: Palabra[]; coincidencias: Coincidencia[] } {
  const contexto = { texto, palabras: separarPalabras(texto) };
  const candidatas: (Coincidencia & { prioridad: number })[] = [];

  for (const entrada of entradas) {
    for (const [prioridad, tipo] of tipos.entries()) {
      for (let desde = 0; desde < contexto.palabras.length; desde++) {
        const hasta = BUSCADORES[tipo](contexto, desde, entrada);
        if (hasta !== null) candidatas.push({ desde, hasta, entrada, prioridad });
      }
    }
  }
  candidatas.sort(
    (a, b) =>
      a.desde - b.desde || b.hasta - b.desde - (a.hasta - a.desde) || a.prioridad - b.prioridad,
  );

  const coincidencias: Coincidencia[] = [];
  let ocupadoHasta = 0;
  for (const { desde, hasta, entrada } of candidatas) {
    if (desde >= ocupadoHasta) {
      coincidencias.push({ desde, hasta, entrada });
      ocupadoHasta = hasta;
    }
  }
  return { palabras: contexto.palabras, coincidencias };
}

function buscarExacta({ texto, palabras }: Contexto, desde: number, entrada: EntradaGlosario) {
  for (const forma of [entrada.termino, ...entrada.variantes]) {
    const buscadas = normalesDe(forma);
    const tramo = palabras.slice(desde, desde + buscadas.length);
    const coincide =
      tramo.length === buscadas.length && tramo.every((p, i) => p.normal === buscadas[i]);
    if (coincide && tramoJunto(texto, tramo)) return desde + buscadas.length;
  }
  return null;
}

// "CI y CD", "CI CD" o "CI-CD" → "CI/CD". Solo para siglas cortas separadas por barra.
function buscarSiglaConBarra(
  { texto, palabras }: Contexto,
  desde: number,
  entrada: EntradaGlosario,
) {
  const partes = normalizar(entrada.termino).split("/");
  if (partes.length < 2 || !partes.every((p) => /^[\p{L}\p{N}]{1,4}$/u.test(p))) return null;

  const primera = palabras[desde];
  if (primera?.normal.split(/[/-]/).join("/") === partes.join("/")) return desde + 1;

  const recorrido = recorrer(palabras, desde, partes, {
    sePuedeSaltar: esConector,
    maximo: partes.length - 1,
  });
  if (!recorrido) return null;
  return tramoJunto(texto, palabras.slice(desde, recorrido.hasta)) ? recorrido.hasta : null;
}

function esConector(palabra: Palabra): boolean {
  return CONECTORES.has(palabra.normal);
}

// "Workers Day de AI" → "Workers AI": hasta dos palabras cortas metidas entre las del término.
function buscarIntercalada({ texto, palabras }: Contexto, desde: number, entrada: EntradaGlosario) {
  const buscadas = normalesDe(entrada.termino);
  if (buscadas.length < 2) return null;

  const recorrido = recorrer(palabras, desde, buscadas, {
    sePuedeSaltar: esIntercalable,
    maximo: MAXIMO_INTERCALADAS,
  });
  if (!recorrido || recorrido.saltadas === 0) return null;
  return tramoJunto(texto, palabras.slice(desde, recorrido.hasta)) ? recorrido.hasta : null;
}

// Recorre las palabras buscadas desde `desde`; entre una y otra puede saltar las que
// `saltos.sePuedeSaltar` acepte, hasta `saltos.maximo` en total.
function recorrer(
  palabras: Palabra[],
  desde: number,
  buscadas: string[],
  saltos: { sePuedeSaltar: (palabra: Palabra, buscada: string) => boolean; maximo: number },
): { hasta: number; saltadas: number } | null {
  let posicion = desde;
  let saltadas = 0;
  for (const [indice, buscada] of buscadas.entries()) {
    let palabra = palabras[posicion];
    while (
      indice > 0 &&
      palabra &&
      saltadas < saltos.maximo &&
      saltos.sePuedeSaltar(palabra, buscada)
    ) {
      saltadas++;
      palabra = palabras[++posicion];
    }
    if (palabra?.normal !== buscada) return null;
    posicion++;
  }
  return { hasta: posicion, saltadas };
}

function esIntercalable(palabra: Palabra, buscada: string): boolean {
  return palabra.normal !== buscada && palabra.normal.length <= LARGO_MAXIMO_INTERCALADA;
}

// "pul request" → "pull request", "Conex" → "Konex". Compara la misma cantidad de palabras que
// tiene el término: así "rollback a" nunca se toma como "rollback" y la vecina no se pierde.
function buscarParecida({ texto, palabras }: Contexto, desde: number, entrada: EntradaGlosario) {
  const buscadas = normalesDe(entrada.termino);
  const letras = buscadas.join("");
  if (letras.length < LARGO_MINIMO_PARECIDO || /\d/.test(letras)) return null;

  const tramo = palabras.slice(desde, desde + buscadas.length);
  if (tramo.length !== buscadas.length || !tramoJunto(texto, tramo)) return null;

  const candidata = tramo.map((p) => p.normal).join(" ");
  const termino = buscadas.join(" ");
  if (candidata === termino || /\d/.test(candidata) || esPlural(candidata, termino)) return null;

  const limite = letras.length >= 8 ? 2 : 1;
  const distancia = distanciaEdicion(Array.from(candidata), Array.from(termino));
  if (distancia > limite || !cadaPalabraSeParece(tramo, buscadas)) return null;
  return desde + buscadas.length;
}

// Además del total, cada palabra por separado: una letra de diferencia cada 3 ("pul" por "pull"),
// así una palabra corta no cambia entera ("Workers Day" no es "Workers AI": la AI puede venir en
// el fragmento siguiente, y de eso se ocupa la corrección del límite entre líneas).
function cadaPalabraSeParece(tramo: readonly Palabra[], buscadas: readonly string[]): boolean {
  return buscadas.every((buscada, i) => {
    const candidata = tramo[i]?.normal ?? "";
    const permitida = Math.floor(buscada.length / 3);
    return distanciaEdicion(Array.from(candidata), Array.from(buscada)) <= permitida;
  });
}

const BUSCADORES: Record<TipoCoincidencia, Buscador> = {
  exacta: buscarExacta,
  "sigla-con-barra": buscarSiglaConBarra,
  intercalada: buscarIntercalada,
  parecida: buscarParecida,
};

// "issues" no es un error de "issue": es su plural y queda como está.
function esPlural(a: string, b: string): boolean {
  return [a + "s", a + "es"].includes(b) || [b + "s", b + "es"].includes(a);
}

function normalesDe(forma: string): string[] {
  return separarPalabras(forma).map((palabra) => palabra.normal);
}

function tramoJunto(texto: string, tramo: Palabra[]): boolean {
  return tramo.every((palabra, i) => {
    const anterior = tramo[i - 1];
    return anterior === undefined || estanJuntas(texto, anterior, palabra);
  });
}

export function reemplazarCoincidencias(opciones: {
  texto: string;
  palabras: Palabra[];
  coincidencias: Coincidencia[];
  reemplazar: (coincidencia: Coincidencia, original: string) => string;
  resto?: (tramo: string) => string;
}): string {
  const { texto, palabras, coincidencias, reemplazar, resto = (tramo) => tramo } = opciones;
  let resultado = "";
  let cursor = 0;

  for (const coincidencia of coincidencias) {
    const inicio = palabras[coincidencia.desde]?.inicio ?? cursor;
    const fin = palabras[coincidencia.hasta - 1]?.fin ?? inicio;
    const original = texto.slice(inicio, fin);
    resultado += resto(texto.slice(cursor, inicio)) + reemplazar(coincidencia, original);
    cursor = fin;
  }
  return resultado + resto(texto.slice(cursor));
}
