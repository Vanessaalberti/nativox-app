import type { RespuestaError } from "@compartido/contratos";

export function responderError(estado: number, codigo: string, mensaje: string): Response {
  const cuerpo: RespuestaError = { ok: false, error: { codigo, mensaje } };
  return Response.json(cuerpo, { status: estado });
}
