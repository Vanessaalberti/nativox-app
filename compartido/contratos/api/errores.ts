import * as v from "valibot";

export const esquemaRespuestaError = v.object({
  ok: v.literal(false),
  error: v.object({ codigo: v.string(), mensaje: v.string() }),
});

export type RespuestaError = v.InferOutput<typeof esquemaRespuestaError>;
