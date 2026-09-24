import { buscarCoincidencias, reemplazarCoincidencias } from "./buscar";
import type { EntradaGlosario } from "./leer";
import { normalizar, separarPalabras } from "./texto";

// Cada traductor respeta una marca distinta: Bergamot, en modo HTML, conserva
// `<span data-g="N">`; los modelos de lenguaje (TranslateGemma) borran el HTML pero respetan el
// formato de código (el término entre acentos graves).
export type Marca = "html" | "codigo";

export interface TerminoProtegido {
  original: string;
  destino: string;
}

export interface TextoProtegido {
  texto: string;
  marca: Marca;
  terminos: TerminoProtegido[];
}

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
  const encontrados = new Set<number>();
  const texto =
    protegido.marca === "html"
      ? restaurarHtml(traducido, protegido.terminos, encontrados)
      : restaurarCodigo(traducido, protegido.terminos, encontrados);

  // Perdido es que no quedó en el texto, con o sin marca: a veces el traductor saca la marca pero
  // deja el término bien escrito.
  const palabrasRestauradas = normalesDe(texto).join(" ");
  const terminosPerdidos = protegido.terminos
    .map((termino) => termino.destino)
    .filter(
      (destino) => !` ${palabrasRestauradas} `.includes(` ${normalesDe(destino).join(" ")} `),
    );
  return { texto, terminosPerdidos };
}

function normalesDe(texto: string): string[] {
  return separarPalabras(texto).map((palabra) => palabra.normal);
}

function marcar(destino: string, indice: number, marca: Marca): string {
  if (marca === "html") return `<span data-g="${String(indice)}">${escaparHtml(destino)}</span>`;
  return "`" + destino + "`";
}

function restaurarHtml(traducido: string, terminos: TerminoProtegido[], encontrados: Set<number>) {
  const sinMarcas = traducido.replace(
    /<span\s+data-g\s*=\s*"(\d+)"[^>]*>[\s\S]*?<\/span>/g,
    (marcaCompleta, indice: string) => {
      const termino = terminos[Number(indice)];
      if (!termino) return marcaCompleta;
      encontrados.add(Number(indice));
      return termino.destino;
    },
  );
  return desescaparHtml(sinMarcas);
}

// El traductor puede cambiar el orden de los términos: cada tramo marcado se asigna al término
// con el mismo texto y, si no hay, al siguiente sin usar.
function restaurarCodigo(
  traducido: string,
  terminos: TerminoProtegido[],
  encontrados: Set<number>,
) {
  return traducido.replace(/`([^`]*)`/g, (marcaCompleta, contenido: string) => {
    const igual = terminos.findIndex(
      (t, i) => !encontrados.has(i) && normalizar(t.destino) === normalizar(contenido.trim()),
    );
    const indice = igual !== -1 ? igual : terminos.findIndex((_, i) => !encontrados.has(i));
    const termino = terminos[indice];
    if (!termino) return marcaCompleta;
    encontrados.add(indice);
    return termino.destino;
  });
}

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
