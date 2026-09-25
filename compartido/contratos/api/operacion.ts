import * as v from "valibot";
import { esquemaTraducciones } from "../socket-sala";

const esquemaAccion = v.picklist(["reiniciar", "pasar-a-la-nube", "silenciar-avisos"]);

// Lo que ve quien abre un link de un aviso, antes de confirmar. El link no lleva sesión: es de un
// solo uso y vence a los 15 minutos.
export const esquemaAccionPendiente = v.object({
  ok: v.literal(true),
  accion: esquemaAccion,
  sala: v.string(),
});

const esquemaSegmento = v.object({
  id: v.string(),
  original: v.string(),
  traducciones: esquemaTraducciones,
  inicio: v.number(),
  fin: v.number(),
});

export const esquemaTranscripcion = v.object({
  ok: v.literal(true),
  segmentos: v.array(esquemaSegmento),
});

export const esquemaRegistroAire = v.object({
  ok: v.literal(true),
  entradas: v.array(
    v.object({
      salida: v.number(),
      // null = sin subtítulos.
      sala: v.nullable(v.string()),
      desde: v.number(),
    }),
  ),
});

export type AccionPendiente = v.InferOutput<typeof esquemaAccionPendiente>;
export type Transcripcion = v.InferOutput<typeof esquemaTranscripcion>;
export type EntradaDeAire = v.InferOutput<typeof esquemaRegistroAire>["entradas"][number];
