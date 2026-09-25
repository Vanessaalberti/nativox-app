import * as v from "valibot";
import { esquemaIdioma } from "../idiomas";
import { esquemaCharla } from "./charlas";

// Lo que ve cualquiera que abre la instancia sin cuenta: el evento, sus salas y sus charlas. Nunca
// incluye el glosario ni nada del equipo.
const esquemaCharlaPublica = v.omit(esquemaCharla, ["salaId", "glosario"]);

const esquemaSalaPublica = v.object({
  id: v.string(),
  nombre: v.string(),
  idiomaOriginal: esquemaIdioma,
  idiomasDestino: v.array(esquemaIdioma),
  // La computadora de la sala está mandando subtítulos ahora.
  enVivo: v.boolean(),
  charlas: v.array(esquemaCharlaPublica),
});

export const esquemaAudiencia = v.object({
  ok: v.literal(true),
  evento: v.nullable(v.object({ nombre: v.string(), logo: v.nullable(v.string()) })),
  salas: v.array(esquemaSalaPublica),
});

// El link que el administrador comparte con la audiencia: /a/<token>.
export const esquemaEnlaceDeAudiencia = v.object({ ok: v.literal(true), token: v.string() });

export type Audiencia = v.InferOutput<typeof esquemaAudiencia>;
export type SalaPublica = Audiencia["salas"][number];
export type CharlaPublica = SalaPublica["charlas"][number];
