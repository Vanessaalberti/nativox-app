import * as v from "valibot";
import { esquemaRespuestaError, validar, type Resultado } from "@compartido/contratos";

const MENSAJE_SIN_CONEXION =
  "No pudimos conectar con tu instancia. Revisá tu conexión y probá de nuevo.";

// Una llamada a /api: manda JSON, valida lo que vuelve y convierte cualquier falla (red, servidor,
// respuesta rara) en un mensaje para mostrar. Nunca lanza.
export async function llamar<E extends v.GenericSchema<unknown, unknown>>(
  ruta: string,
  esquema: E,
  {
    metodo = "GET",
    cuerpo,
    audio,
  }: {
    metodo?: "GET" | "POST" | "PUT" | "DELETE";
    cuerpo?: unknown;
    // Un audio en lugar de JSON (la transcripción en la nube): el tipo y, aparte, lo que se manda.
    audio?: { tipo: string; datos: Uint8Array<ArrayBuffer>; encabezados: Record<string, string> };
  } = {},
): Promise<Resultado<v.InferOutput<E>>> {
  const init: RequestInit = { method: metodo, credentials: "same-origin" };
  if (cuerpo !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(cuerpo);
  }
  if (audio) {
    init.headers = { "Content-Type": audio.tipo, ...audio.encabezados };
    init.body = audio.datos;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, init);
  } catch {
    return { ok: false, motivo: MENSAJE_SIN_CONEXION };
  }

  let dato: unknown;
  try {
    dato = await respuesta.json();
  } catch {
    return {
      ok: false,
      motivo: `Respuesta inesperada del servidor (${String(respuesta.status)}).`,
    };
  }

  if (!respuesta.ok) {
    const error = validar(esquemaRespuestaError, dato);
    return {
      ok: false,
      motivo: error.ok ? error.valor.error.mensaje : `Error ${String(respuesta.status)}.`,
    };
  }
  return validar(esquema, dato);
}
