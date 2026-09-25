import { ROLES_DE_SALA } from "@compartido/contratos";
import { ENCABEZADO_DE_ROL } from "@servidor/plataforma/tiempo-real";
import { responderError } from "@servidor/plataforma/errores";
import { puedeVerSala, sesionDe, type ContextoApi } from "./sesion";
import { salaInexistente } from "./con-sala";

// GET /api/salas/:id/ws?rol=publicador|espectador|monitor — abre el WebSocket de una sala.
// Quien mira (espectador) no necesita cuenta; quien publica o monitorea tiene que ser el
// administrador o un operador con esa sala. El rol lo decide el servidor: el Durable Object solo
// acepta el que le llega en un encabezado que el navegador no puede poner.
export async function abrirSala(
  pedido: Request,
  contexto: ContextoApi,
  salaId = "",
): Promise<Response> {
  if (pedido.headers.get("Upgrade") !== "websocket") {
    return responderError(426, "se_esperaba_websocket", "Esta dirección es para WebSocket.");
  }
  const pedida = new URL(pedido.url).searchParams.get("rol");
  const rol = ROLES_DE_SALA.find((posible) => posible === pedida);
  if (!rol)
    return responderError(
      400,
      "rol_invalido",
      "El rol tiene que ser publicador, espectador o monitor.",
    );
  if (!(await contexto.agenda.leerSala(salaId))) return salaInexistente();

  if (rol !== "espectador") {
    const sesion = await sesionDe(pedido, contexto);
    if (!sesion) return responderError(401, "sin_sesion", "Ingresá para continuar.");
    if (!(await puedeVerSala(contexto, sesion, salaId))) {
      return responderError(403, "sin_permiso", "No tenés acceso a esta sala.");
    }
  }

  const reenviado = new Request(pedido);
  reenviado.headers.set(ENCABEZADO_DE_ROL, rol);
  return contexto.tiempoReal.conectar(salaId, reenviado);
}
