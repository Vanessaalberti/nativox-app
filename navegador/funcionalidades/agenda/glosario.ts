import { leerGlosario } from "@compartido/glosario";

// Palabras que suelen ir con mayúscula en un título y no son términos técnicos.
const NO_SON_TERMINOS = new Set([
  "cómo",
  "como",
  "para",
  "con",
  "desde",
  "hacia",
  "sobre",
  "entre",
  "charla",
  "taller",
  "panel",
  "mesa",
  "redonda",
  "introducción",
  "apertura",
  "cierre",
  "the",
  "and",
  "with",
  "from",
]);

const MAXIMO_DE_SUGERENCIAS = 8;

// Lo que parece un término: una sigla o una palabra con mayúsculas o números adentro ("AWS",
// "WebGPU", "k8s"), o una palabra con mayúscula que no abre la oración ("Nerdearla").
function parecePalabraClave(palabra: string, indice: number): boolean {
  return /[A-Z].*[A-Z]|\d/.test(palabra) || (indice > 0 && /^[A-ZÁÉÍÓÚ]/.test(palabra));
}

// Sugiere términos para el glosario de una charla a partir de su título y su resumen. Es una
// heurística local, sin IA: mira cada oración por separado (la mayúscula del comienzo no cuenta)
// y no repite lo que ya está en el glosario. Nada entra al glosario sin que se acepte.
export function sugerirTerminos(titulo: string, resumen: string, glosario: string): string[] {
  const yaEstan = new Set(leerGlosario(glosario).map((entrada) => entrada.termino.toLowerCase()));
  const oraciones = [titulo, ...resumen.split(/[.?!]\s+/)];
  const candidatos = oraciones.flatMap((oracion) =>
    oracion
      .split(/[\s,.;:()¿?¡!"“”]+/)
      .filter(
        (palabra, indice) =>
          palabra.length >= 3 &&
          parecePalabraClave(palabra, indice) &&
          !NO_SON_TERMINOS.has(palabra.toLowerCase()) &&
          !yaEstan.has(palabra.toLowerCase()),
      ),
  );
  return [...new Set(candidatos)].slice(0, MAXIMO_DE_SUGERENCIAS);
}

// Suma términos al glosario, uno por renglón, sin repetir los que ya están.
export function agregarTerminos(glosario: string, terminos: readonly string[]): string {
  const yaEstan = new Set(leerGlosario(glosario).map((entrada) => entrada.termino.toLowerCase()));
  const nuevos = terminos.filter((termino) => {
    const clave = termino.trim().toLowerCase();
    if (clave === "" || yaEstan.has(clave)) return false;
    yaEstan.add(clave);
    return true;
  });
  if (nuevos.length === 0) return glosario;
  const base = glosario.trimEnd();
  return `${base}${base === "" ? "" : "\n"}${nuevos.map((termino) => termino.trim()).join("\n")}`;
}

// Un .txt trae un término por renglón (y admite `~` y `=>`); un .csv, uno por fila: se toma la
// primera columna.
export function leerArchivoDeGlosario(nombre: string, contenido: string): string {
  const renglones = contenido.split(/\r?\n/);
  if (!/\.csv$/i.test(nombre)) return renglones.join("\n");
  return renglones
    .map((renglon) => (renglon.split(/[;,]/)[0] ?? "").trim().replace(/^"(.*)"$/, "$1"))
    .join("\n");
}
