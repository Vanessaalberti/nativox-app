import {
  LARGO_MAXIMO_DE_LOGO,
  esquemaActualizarEvento,
  esquemaDatosEvento,
  esquemaEliminarEvento,
  type EstadoDeLaInstancia,
} from "@compartido/contratos";
import { responderError } from "@servidor/plataforma/errores";
import { conCuerpo, leerCuerpo } from "@servidor/plataforma/pedido";
import {
  comoAdministrador,
  cookieVencida,
  exigirAdministrador,
  responderConCookie,
  sesionDe,
  type ContextoApi,
} from "./sesion";

// El mismo formato que al crear el evento: una imagen chica en base64 (png, jpeg o webp).
const FORMATO_DE_LOGO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const esquemaLogoAceptado = (logo: string) =>
  logo.length <= LARGO_MAXIMO_DE_LOGO && FORMATO_DE_LOGO.test(logo);

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

// Ajustes → General: nombre, logo y fechas. La estimación (salas, horas, días) no se toca acá.
export function actualizarEvento(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaActualizarEvento, async (cambios) => {
      if (cambios.fechaInicio && cambios.fechaFin && cambios.fechaInicio > cambios.fechaFin) {
        return responderError(
          400,
          "pedido_invalido",
          "La fecha de fin no puede ser anterior a la de inicio.",
        );
      }
      if (cambios.logo !== null && !esquemaLogoAceptado(cambios.logo)) {
        return responderError(
          400,
          "pedido_invalido",
          "El logo no es una imagen válida o pesa demasiado.",
        );
      }
      return (await contexto.almacen.actualizarEvento(cambios))
        ? Response.json({ ok: true })
        : responderError(404, "sin_evento", "Todavía no se creó el evento.");
    }),
  );
}

// Elimina TODO lo de la instancia (evento, salas, charlas, equipo, salidas, ajustes y la cuenta del
// administrador). Se pide escribir el nombre del evento, para no borrar por error.
export function eliminarEvento(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaEliminarEvento, async ({ nombre }) => {
      const evento = await contexto.almacen.leerEvento();
      if (!evento) return responderError(404, "sin_evento", "Todavía no se creó el evento.");
      if (nombre.trim() !== evento.nombre) {
        return responderError(
          400,
          "confirmacion_incorrecta",
          "El nombre no coincide con el del evento.",
        );
      }

      await contexto.agenda.borrarTodo();
      await contexto.operadores.borrarTodo();
      await contexto.produccion.borrarTodo();
      await contexto.operacion.borrarTodo();
      await contexto.ajustes.borrarTodo();
      await contexto.almacen.borrarTodo();
      return responderConCookie({ ok: true }, cookieVencida(contexto.segura));
    }),
  );
}
