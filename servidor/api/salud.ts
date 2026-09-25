// Lo usan el deploy y el monitoreo para saber si el Worker responde.
export function responderSalud(): Response {
  return Response.json({ ok: true, servicio: "nativox" });
}
