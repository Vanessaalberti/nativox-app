import * as v from "valibot";
import { esquemaIdioma } from "../idiomas";

export const MINUTOS_POR_DIA = 1440;

export const LARGO_MAXIMO_DEL_GLOSARIO = 20_000;

const esquemaTexto = (maximo: number) =>
  v.optional(v.pipe(v.string(), v.trim(), v.maxLength(maximo)), "");

export const esquemaDatosDeCharla = v.pipe(
  v.object({
    titulo: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, "Poné un título a la charla."),
      v.maxLength(120, "El título es demasiado largo."),
    ),
    resumen: esquemaTexto(1000),
    oradores: esquemaTexto(200),
    // El día (AAAA-MM-DD) y el horario en minutos desde la medianoche, en la hora local del evento.
    fecha: v.pipe(v.string(), v.isoDate("La fecha no es válida.")),
    inicioMin: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(MINUTOS_POR_DIA - 1)),
    finMin: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(MINUTOS_POR_DIA)),
    // null: se habla el idioma original de la sala.
    idioma: v.optional(v.nullable(esquemaIdioma), null),
    // En el formato de `compartido/glosario`: un término por renglón.
    glosario: v.optional(v.pipe(v.string(), v.maxLength(LARGO_MAXIMO_DEL_GLOSARIO)), ""),
  }),
  v.forward(
    v.check(
      (charla) => charla.finMin > charla.inicioMin,
      "La charla tiene que terminar después de empezar.",
    ),
    ["finMin"],
  ),
);

export const esquemaCharla = v.object({
  id: v.string(),
  salaId: v.string(),
  titulo: v.string(),
  resumen: v.string(),
  oradores: v.string(),
  fecha: v.string(),
  inicioMin: v.number(),
  finMin: v.number(),
  idioma: v.nullable(esquemaIdioma),
  glosario: v.string(),
});

export const esquemaListaDeCharlas = v.object({
  ok: v.literal(true),
  charlas: v.array(esquemaCharla),
});

export const esquemaUnaCharla = v.object({ ok: v.literal(true), charla: esquemaCharla });

export type DatosDeCharla = v.InferOutput<typeof esquemaDatosDeCharla>;
export type Charla = v.InferOutput<typeof esquemaCharla>;
