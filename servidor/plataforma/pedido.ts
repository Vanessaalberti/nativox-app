import * as v from "valibot";
import { validar, type Resultado } from "@compartido/contratos";
import { responderError } from "./errores";

// El logo (una imagen chica en base64) es lo más pesado que se manda: 150 mil caracteres.
const CARACTERES_MAXIMOS_DEL_CUERPO = 200_000;

// Lee y valida el cuerpo JSON de un pedido. Pedir `application/json` también sirve de defensa: un
// formulario de otro sitio no puede mandar ese tipo sin permiso (CORS).
export async function leerCuerpo<E extends v.GenericSchema<unknown, unknown>>(
  pedido: Request,
  esquema: E,
): Promise<Resultado<v.InferOutput<E>>> {
  if (!(pedido.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) {
    return { ok: false, motivo: "El pedido tiene que ser application/json." };
  }
  const texto = await pedido.text();
  if (texto.length > CARACTERES_MAXIMOS_DEL_CUERPO) {
    return { ok: false, motivo: "El pedido es demasiado grande." };
  }
  let dato: unknown;
  try {
    dato = JSON.parse(texto);
  } catch {
    return { ok: false, motivo: "El cuerpo no es un JSON válido." };
  }
  return validar(esquema, dato);
}

// Valida el cuerpo del pedido y, si está mal, responde 400 con el motivo; si está bien, corre la
// acción con el dato ya validado.
export async function conCuerpo<E extends v.GenericSchema<unknown, unknown>>(
  pedido: Request,
  esquema: E,
  accion: (cuerpo: v.InferOutput<E>) => Promise<Response>,
): Promise<Response> {
  const cuerpo = await leerCuerpo(pedido, esquema);
  return cuerpo.ok ? accion(cuerpo.valor) : responderError(400, "pedido_invalido", cuerpo.motivo);
}
