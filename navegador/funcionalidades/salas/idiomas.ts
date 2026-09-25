import { NOMBRES_DE_IDIOMA, type Idioma } from "@compartido/contratos";

// "Español → English, Português" (o solo "Español" si no se traduce).
export function describirIdiomas(original: Idioma, destino: readonly Idioma[]): string {
  return destino.length === 0
    ? NOMBRES_DE_IDIOMA[original]
    : `${NOMBRES_DE_IDIOMA[original]} → ${destino.map((idioma) => NOMBRES_DE_IDIOMA[idioma]).join(", ")}`;
}
