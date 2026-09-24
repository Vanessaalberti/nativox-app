import type { EntradaGlosario } from "./leer";

// Whisper acepta hasta 224 tokens de prompt y, si se pasa, descarta el principio (que es donde
// va el glosario). Sin el tokenizador a mano se estima de más: ~3 caracteres por token, cuando
// en español e inglés suelen ser ~4.
const MAXIMO_TOKENS = 224;
const CARACTERES_POR_TOKEN = 3;
const CARACTERES_DE_CONTEXTO = 200;

// Términos por prioridad (el orden del glosario) + los últimos ~200 caracteres ya transcriptos,
// que le dan continuidad a la frase cortada.
export function armarPromptWhisper(
  entradas: readonly EntradaGlosario[],
  textoAnterior: string,
): string {
  const contexto = ultimoTramo(textoAnterior.trim(), CARACTERES_DE_CONTEXTO);
  const disponible = MAXIMO_TOKENS * CARACTERES_POR_TOKEN - contexto.length - 2;

  const terminos: string[] = [];
  let largo = 0;
  for (const { termino } of entradas) {
    const agregado = (terminos.length === 0 ? 0 : 2) + termino.length;
    if (largo + agregado > disponible) break;
    terminos.push(termino);
    largo += agregado;
  }

  const glosario = terminos.length > 0 ? `${terminos.join(", ")}.` : "";
  return [glosario, contexto].filter((parte) => parte !== "").join(" ");
}

// Corta al principio de una palabra, para no darle a Whisper media palabra.
function ultimoTramo(texto: string, maximo: number): string {
  if (texto.length <= maximo) return texto;
  const tramo = texto.slice(-maximo);
  const primerEspacio = tramo.search(/\s/);
  return primerEspacio === -1 ? tramo : tramo.slice(primerEspacio + 1);
}
