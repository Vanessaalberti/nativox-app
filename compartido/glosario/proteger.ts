import { buscarCoincidencias, reemplazarCoincidencias } from "./buscar";
import type { EntradaGlosario } from "./leer";
import { normalizar, separarPalabras } from "./texto";

// Cada traductor respeta una marca distinta:
// - `clave`: el término se reemplaza por un código opaco (NTXA, NTXB…) y se repone después. Es
//   la de Bergamot: medido el 24/09, sus modelos inglés→portugués traducen y parten lo que va
//   dentro de `<span>` (y es→pt pasa por el inglés), pero copian los códigos tal cual en los dos
//   tramos. Los códigos llevan letras distintas: con números parecidos (X1Q, X2W) los mezcla.
// - `html`: `<span data-g="N">término</span>`, para traductores con modo HTML que lo respetan.
// - `codigo`: el término entre acentos graves, para los modelos de lenguaje (TranslateGemma),
//   que borran el HTML.
export type Marca = "clave" | "html" | "codigo";

export interface TerminoProtegido {
  original: string;
  destino: string;
}

export interface TextoProtegido {
  texto: string;
  marca: Marca;
  terminos: TerminoProtegido[];
}

const PREFIJO_CLAVE = "NTX";

// El término va marcado dentro de la frase entera, así el traductor ve la gramática completa
// y deja ese tramo como está (ya en su forma del idioma destino).
export function proteger(
  texto: string,
  entradas: readonly EntradaGlosario[],
  idiomaDestino: string,
  marca: Marca,
): TextoProtegido {
  const { palabras, coincidencias } = buscarCoincidencias(texto, entradas, ["exacta"]);
  const terminos: TerminoProtegido[] = [];

  const marcado = reemplazarCoincidencias({
    texto,
    palabras,
    coincidencias,
    reemplazar: ({ entrada }, original) => {
      const destino = entrada.traducciones[idiomaDestino] ?? entrada.termino;
      terminos.push({ original, destino });
      return marcar(destino, terminos.length - 1, marca);
    },
    resto: marca === "html" ? escaparHtml : (tramo) => tramo,
  });
  return { texto: marcado, marca, terminos };
}

export function restaurar(
  traducido: string,
  protegido: TextoProtegido,
): { texto: string; terminosPerdidos: string[] } {
  const texto = RESTAURAR[protegido.marca](traducido, protegido.terminos);

  // Perdido es que no quedó escrito tal cual en el texto, con o sin marca: a veces el traductor saca
  // la marca pero deja el término bien; si lo cambia ("workers ai" por "Workers AI"), se perdió.
  const palabrasRestauradas = palabrasDe(texto).join(" ");
  const terminosPerdidos = protegido.terminos
    .map((termino) => termino.destino)
    .filter(
      (destino) => !` ${palabrasRestauradas} `.includes(` ${palabrasDe(destino).join(" ")} `),
    );
  return { texto, terminosPerdidos };
}

function palabrasDe(texto: string): string[] {
  return separarPalabras(texto).map((palabra) => palabra.texto);
}

function marcar(destino: string, indice: number, marca: Marca): string {
  if (marca === "clave") return PREFIJO_CLAVE + letrasDe(indice);
  if (marca === "html") return `<span data-g="${String(indice)}">${escaparHtml(destino)}</span>`;
  return "`" + destino + "`";
}

// 0 → A, 25 → Z, 26 → AA…
function letrasDe(indice: number): string {
  const letra = String.fromCharCode(65 + (indice % 26));
  return indice < 26 ? letra : letrasDe(Math.floor(indice / 26) - 1) + letra;
}

function indiceDe(letras: string): number {
  return Array.from(letras).reduce((total, letra) => total * 26 + letra.charCodeAt(0) - 64, 0) - 1;
}

type Restaurador = (traducido: string, terminos: TerminoProtegido[]) => string;

// Si el traductor repite un código, el término va solo en el primero.
const restaurarClave: Restaurador = (traducido, terminos) => {
  const usados = new Set<number>();
  return traducido
    .replace(new RegExp(`${PREFIJO_CLAVE}([A-Z]{1,2})\\b`, "gi"), (codigo, letras: string) => {
      const indice = indiceDe(letras.toUpperCase());
      const termino = terminos[indice];
      if (!termino) return codigo;
      if (usados.has(indice)) return "";
      usados.add(indice);
      return termino.destino;
    })
    .replace(/ {2,}/g, " ")
    .replace(/ ([.,;:!?])/g, "$1");
};

const restaurarHtml: Restaurador = (traducido, terminos) => {
  const sinMarcas = traducido.replace(
    /<span\s+data-g\s*=\s*"(\d+)"[^>]*>[\s\S]*?<\/span>/g,
    (marcaCompleta, indice: string) => terminos[Number(indice)]?.destino ?? marcaCompleta,
  );
  return desescaparHtml(sinMarcas);
};

// El traductor puede cambiar el orden de los términos: cada tramo marcado se asigna al término
// con el mismo texto y, si no hay, al siguiente sin usar.
const restaurarCodigo: Restaurador = (traducido, terminos) => {
  const usados = new Set<number>();
  return traducido.replace(/`([^`]*)`/g, (marcaCompleta, contenido: string) => {
    const igual = terminos.findIndex(
      (t, i) => !usados.has(i) && normalizar(t.destino) === normalizar(contenido.trim()),
    );
    const indice = igual !== -1 ? igual : terminos.findIndex((_, i) => !usados.has(i));
    const termino = terminos[indice];
    if (!termino) return marcaCompleta;
    usados.add(indice);
    return termino.destino;
  });
};

const RESTAURAR: Record<Marca, Restaurador> = {
  clave: restaurarClave,
  html: restaurarHtml,
  codigo: restaurarCodigo,
};

const ENTIDADES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"]/g, (caracter) => ENTIDADES[caracter] ?? caracter);
}

function desescaparHtml(texto: string): string {
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
