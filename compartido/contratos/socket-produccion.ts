import * as v from "valibot";
import { esquemaIdioma } from "./idiomas";

export const esquemaEstiloSalida = v.object({
  idioma: esquemaIdioma,
  lineas: v.picklist([1, 2, 3]),
  posicion: v.picklist(["abajo", "arriba"]),
  mostrarOriginal: v.boolean(),
  // Píxeles sobre 1920 de ancho: vMix y OBS cargan la página a 1920 × 1080.
  tamanoLetra: v.pipe(v.number(), v.integer(), v.minValue(16), v.maxValue(120)),
});

export const esquemaSalida = v.object({
  tipo: v.literal("salida"),
  numero: v.pipe(v.number(), v.integer(), v.minValue(1)),
  salaAlAire: v.nullable(v.pipe(v.string(), v.nonEmpty())),
  estilo: esquemaEstiloSalida,
});

export type EstiloSalida = v.InferOutput<typeof esquemaEstiloSalida>;
export type Salida = v.InferOutput<typeof esquemaSalida>;
