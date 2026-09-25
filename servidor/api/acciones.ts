import { hashearToken } from "@servidor/modulos/cripto-acceso";
import { avisoDeAccion } from "@servidor/modulos/avisos";
import { responderError } from "@servidor/plataforma/errores";
import { CLAVE_DEL_WEBHOOK } from "@servidor/plataforma/leer-ajustes";
import type { ContextoApi } from "./sesion";

const enlaceInvalido = () =>
  responderError(404, "enlace_invalido", "Este link ya se usó, venció o no existe.");

// GET /api/publico/acciones/:token — qué va a pasar si se confirma. No gasta el link: Discord y
// otros programas "miran" los links que se pegan en un chat, y eso no puede ejecutar nada.
export async function verAccion(
  _pedido: Request,
  contexto: ContextoApi,
  token = "",
): Promise<Response> {
  const pendiente = await contexto.operacion.leerAccion(
    await hashearToken(token),
    contexto.ahora(),
  );
  if (!pendiente) return enlaceInvalido();
  const sala = await contexto.agenda.leerSala(pendiente.salaId);
  return Response.json({ ok: true, accion: pendiente.accion, sala: sala?.nombre ?? "Sala" });
}

// POST /api/publico/acciones/:token — confirma: gasta el link (una sola vez, y solo si no venció),
// le pide la acción a la sala y avisa al canal. No pide sesión: el link es el permiso, y sirve
// desde el celular sin iniciar sesión.
export async function confirmarAccion(
  _pedido: Request,
  contexto: ContextoApi,
  token = "",
): Promise<Response> {
  const pendiente = await contexto.operacion.consumirAccion(
    await hashearToken(token),
    contexto.ahora(),
  );
  if (!pendiente) return enlaceInvalido();

  const { publicando } = await contexto.tiempoReal.comando(pendiente.salaId, pendiente.accion);
  if (pendiente.accion !== "silenciar-avisos" && publicando === 0) {
    return responderError(
      409,
      "sala_desconectada",
      "La computadora de la sala no está conectada: no hay a quién pedirle que reinicie. Revisá que tenga corriente e internet.",
    );
  }

  const sala = await contexto.agenda.leerSala(pendiente.salaId);
  const direccion = await contexto.ajustes.leer(CLAVE_DEL_WEBHOOK);
  if (direccion !== null) {
    await contexto.avisos.enviar(
      direccion,
      avisoDeAccion({ sala: sala?.nombre ?? "Sala", accion: pendiente.accion }),
    );
  }
  return Response.json({ ok: true, accion: pendiente.accion, sala: sala?.nombre ?? "Sala" });
}
