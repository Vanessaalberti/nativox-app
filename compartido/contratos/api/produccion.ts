import * as v from "valibot";
import { esquemaIdioma } from "../idiomas";
import { esquemaEstiloSalida, type EstiloSalida } from "../socket-produccion";

// El estilo con el que arranca una sala o una salida: 2 líneas abajo, en español, sin el original.
export const ESTILO_POR_DEFECTO: EstiloSalida = {
  idioma: "es",
  lineas: 2,
  posicion: "abajo",
  mostrarOriginal: false,
  tamanoLetra: 56,
};

const esquemaIdDeSala = v.pipe(v.string(), v.regex(/^[0-9a-f]{12}$/));

export const esquemaDatosDeSalida = v.object({
  nombre: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Poné un nombre a la salida."),
    v.maxLength(40, "El nombre es demasiado largo."),
  ),
  // La sala que sale por esta salida; null = sin subtítulos.
  salaAlAire: v.nullable(esquemaIdDeSala),
  estilo: esquemaEstiloSalida,
});

const esquemaSalidaCompleta = v.object({
  numero: v.number(),
  nombre: v.string(),
  salaAlAire: v.nullable(v.string()),
  estilo: esquemaEstiloSalida,
});

export const esquemaListaDeSalidas = v.object({
  ok: v.literal(true),
  salidas: v.array(esquemaSalidaCompleta),
});

export const esquemaUnaSalida = v.object({ ok: v.literal(true), salida: esquemaSalidaCompleta });

// Lo que necesita la página de una salida o de una sala en vMix/OBS: no tiene sesión (es un
// navegador dentro del programa de transmisión), así que esto es público y no lleva nada sensible.
const esquemaSalaDeTransmision = v.object({
  id: v.string(),
  nombre: v.string(),
  idiomaOriginal: esquemaIdioma,
  idiomasDestino: v.array(esquemaIdioma),
});

export const esquemaTransmision = v.object({
  ok: v.literal(true),
  // null si la salida no tiene sala al aire.
  sala: v.nullable(esquemaSalaDeTransmision),
  estilo: esquemaEstiloSalida,
});

export type DatosDeSalida = v.InferOutput<typeof esquemaDatosDeSalida>;
export type SalidaDeProduccion = v.InferOutput<typeof esquemaSalidaCompleta>;
export type Transmision = v.InferOutput<typeof esquemaTransmision>;
