import * as v from "valibot";
import { esquemaIdioma } from "../idiomas";

export const MAXIMO_DE_SALAS_POR_PEDIDO = 60;

const esquemaNombreDeSala = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Poné un nombre a la sala."),
  v.maxLength(60, "El nombre de la sala es demasiado largo."),
);

// Se traduce a uno, a los dos o a ninguno de los otros idiomas; nunca al mismo que se habla.
export const esquemaDatosDeSala = v.pipe(
  v.object({
    nombre: esquemaNombreDeSala,
    idiomaOriginal: esquemaIdioma,
    idiomasDestino: v.pipe(v.array(esquemaIdioma), v.maxLength(2)),
  }),
  v.check(
    (sala) =>
      !sala.idiomasDestino.includes(sala.idiomaOriginal) &&
      new Set(sala.idiomasDestino).size === sala.idiomasDestino.length,
    "Los idiomas destino no pueden repetirse ni incluir el idioma que se habla.",
  ),
);

export const esquemaCrearSalas = v.object({
  salas: v.pipe(
    v.array(esquemaDatosDeSala),
    v.minLength(1),
    v.maxLength(MAXIMO_DE_SALAS_POR_PEDIDO),
  ),
});

export const esquemaSala = v.object({
  id: v.string(),
  nombre: v.string(),
  idiomaOriginal: esquemaIdioma,
  idiomasDestino: v.array(esquemaIdioma),
  charlas: v.number(),
});

export const esquemaListaDeSalas = v.object({ ok: v.literal(true), salas: v.array(esquemaSala) });

export const esquemaUnaSala = v.object({ ok: v.literal(true), sala: esquemaSala });

export type DatosDeSala = v.InferOutput<typeof esquemaDatosDeSala>;
export type CrearSalas = v.InferOutput<typeof esquemaCrearSalas>;
export type Sala = v.InferOutput<typeof esquemaSala>;
