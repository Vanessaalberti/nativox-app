import { esquemaDatosEvento, type EstadoDeLaInstancia } from "@compartido/contratos";
import { responderError } from "@servidor/plataforma/errores";
import { leerCuerpo } from "@servidor/plataforma/pedido";
import { exigirAdministrador, sesionDe, type ContextoApi } from "./sesion";

// Lo primero que pregunta la app al abrirse: qué falta hacer en esta instancia y quién es la
// persona. No devuelve nada sensible (ni email ni datos de la cuenta).
export async function responderEstado(pedido: Request, contexto: ContextoApi): Promise<Response> {
  const [administrador, evento, sesion] = await Promise.all([
    contexto.almacen.leerAdministrador(),
    contexto.almacen.leerEvento(),
    sesionDe(pedido, contexto),
  ]);
  const estado: EstadoDeLaInstancia = {
    ok: true,
    hayAdministrador: administrador !== null,
    hayEvento: evento !== null,
    sesion: sesion ? { rol: sesion.rol } : null,
    evento: evento ? { nombre: evento.nombre, logo: evento.logo } : null,
  };
  return Response.json(estado);
}

// Paso 3 del asistente: crea el evento. Solo el administrador, y solo una vez por instancia.
export async function crearEvento(pedido: Request, contexto: ContextoApi): Promise<Response> {
  const denegado = await exigirAdministrador(pedido, contexto);
  if (denegado) return denegado;

  const cuerpo = await leerCuerpo(pedido, esquemaDatosEvento);
  if (!cuerpo.ok) return responderError(400, "pedido_invalido", cuerpo.motivo);

  const creado = await contexto.almacen.crearEvento(cuerpo.valor, contexto.ahora());
  if (!creado) return responderError(409, "evento_existente", "Esta instancia ya tiene un evento.");
  return Response.json({ ok: true }, { status: 201 });
}

export async function leerEvento(pedido: Request, contexto: ContextoApi): Promise<Response> {
  const denegado = await exigirAdministrador(pedido, contexto);
  if (denegado) return denegado;

  const [evento, administrador] = await Promise.all([
    contexto.almacen.leerEvento(),
    contexto.almacen.leerAdministrador(),
  ]);
  if (!evento || !administrador) {
    return responderError(404, "sin_evento", "Todavía no se creó el evento.");
  }
  return Response.json({ ok: true, evento, email: administrador.email });
}
