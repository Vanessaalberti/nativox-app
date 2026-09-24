import { normalizar } from "./texto";

export interface EntradaGlosario {
  termino: string;
  variantes: string[];
  traducciones: Record<string, string>;
}

// Formato, una entrada por línea:
//   Kubernetes
//   Nerdearla ~ ner de arla, nerd earla
//   rama main => en: main branch | pt: branch main
// Las líneas vacías y las que empiezan con # se saltean. El orden es la prioridad (lo usa el
// prompt de Whisper). Un término repetido se une con el anterior.
export function leerGlosario(texto: string): EntradaGlosario[] {
  const porTermino = new Map<string, EntradaGlosario>();

  for (const linea of texto.split(/\r?\n/)) {
    const entrada = leerLinea(linea.trim());
    if (!entrada) continue;

    const clave = normalizar(entrada.termino);
    const existente = porTermino.get(clave);
    if (existente) {
      existente.variantes = [...new Set([...existente.variantes, ...entrada.variantes])];
      existente.traducciones = { ...existente.traducciones, ...entrada.traducciones };
    } else {
      porTermino.set(clave, entrada);
    }
  }
  return [...porTermino.values()];
}

function leerLinea(linea: string): EntradaGlosario | null {
  if (linea === "" || linea.startsWith("#")) return null;

  const [izquierda = "", derecha = ""] = partirEnLaPrimera(linea, "=>");
  const [termino = "", variantes = ""] = partirEnLaPrimera(izquierda, "~");
  if (termino.trim() === "") return null;

  return {
    termino: termino.trim(),
    variantes: variantes
      .split(",")
      .map((variante) => variante.trim())
      .filter((variante) => variante !== ""),
    traducciones: leerTraducciones(derecha),
  };
}

function leerTraducciones(texto: string): Record<string, string> {
  const traducciones: Record<string, string> = {};
  for (const parte of texto.split("|")) {
    const [idioma = "", traduccion = ""] = partirEnLaPrimera(parte, ":");
    if (idioma.trim() !== "" && traduccion.trim() !== "") {
      traducciones[idioma.trim().toLowerCase()] = traduccion.trim();
    }
  }
  return traducciones;
}

function partirEnLaPrimera(texto: string, separador: string): string[] {
  const posicion = texto.indexOf(separador);
  if (posicion === -1) return [texto];
  return [texto.slice(0, posicion), texto.slice(posicion + separador.length)];
}
