import * as v from "valibot";

export const IDIOMAS = ["es", "en", "pt"] as const;

export const NOMBRES_DE_IDIOMA: Record<(typeof IDIOMAS)[number], string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

export const esquemaIdioma = v.picklist(IDIOMAS);

export type Idioma = v.InferOutput<typeof esquemaIdioma>;
