import * as v from "valibot";

export const IDIOMAS = ["es", "en", "pt"] as const;

export const esquemaIdioma = v.picklist(IDIOMAS);

export type Idioma = v.InferOutput<typeof esquemaIdioma>;
