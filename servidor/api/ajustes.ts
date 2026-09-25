import { esquemaAjustes, esquemaWebhook, type Ajustes } from "@compartido/contratos";
import { responderError } from "@servidor/plataforma/errores";
import {
  CLAVE_DE_AJUSTES,
  CLAVE_DEL_WEBHOOK,
  leerAjustesGuardados,
} from "@servidor/plataforma/leer-ajustes";
import { conCuerpo } from "@servidor/plataforma/pedido";
import { comoAdministrador, comoPersona, type ContextoApi } from "./sesion";

// Solo se acepta la dirección de un canal conocido: el servidor hace un pedido a esa dirección
// (para probarla y avisar), así que no puede ser cualquier sitio.
const CANALES_ACEPTADOS: { dominio: string; ruta: string }[] = [
  { dominio: "discord.com", ruta: "/api/webhooks/" },
  { dominio: "discordapp.com", ruta: "/api/webhooks/" },
  { dominio: "hooks.slack.com", ruta: "/services/" },
  { dominio: "chat.googleapis.com", ruta: "/v1/spaces/" },
];

export function esWebhookAceptado(direccion: string): boolean {
  let url: URL;
  try {
    url = new URL(direccion);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    CANALES_ACEPTADOS.some(
      ({ dominio, ruta }) =>
        (url.hostname === dominio || url.hostname.endsWith(`.${dominio}`)) &&
        url.pathname.startsWith(ruta),
    )
  );
}

async function leerAjustes(contexto: ContextoApi): Promise<Ajustes> {
  const evento = await contexto.almacen.leerEvento();
  const base = await leerAjustesGuardados(contexto.ajustes);
  return { ...base, nubeComoRespaldo: evento?.nubeComoRespaldo ?? base.nubeComoRespaldo };
}

async function responderConAjustes(contexto: ContextoApi): Promise<Response> {
  return Response.json({
    ok: true,
    ajustes: await leerAjustes(contexto),
    webhookConfigurado: (await contexto.ajustes.leer(CLAVE_DEL_WEBHOOK)) !== null,
  });
}

export function leerLosAjustes(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, () => responderConAjustes(contexto));
}

export function guardarLosAjustes(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaAjustes, async (ajustes) => {
      const evento = await contexto.almacen.leerEvento();
      if (!evento) return responderError(404, "sin_evento", "Todavía no se creó el evento.");

      await contexto.ajustes.guardar(CLAVE_DE_AJUSTES, JSON.stringify(ajustes));
      await contexto.almacen.actualizarEvento({
        nombre: evento.nombre,
        logo: evento.logo,
        fechaInicio: evento.fechaInicio,
        fechaFin: evento.fechaFin,
        nubeComoRespaldo: ajustes.nubeComoRespaldo,
      });
      return responderConAjustes(contexto);
    }),
  );
}

// Guarda o borra la dirección del canal de avisos. Nunca se devuelve: es un secreto.
export function guardarElWebhook(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaWebhook, async ({ url }) => {
      if (url === null) {
        await contexto.ajustes.borrar(CLAVE_DEL_WEBHOOK);
      } else if (esWebhookAceptado(url)) {
        await contexto.ajustes.guardar(CLAVE_DEL_WEBHOOK, url);
      } else {
        return responderError(
          400,
          "webhook_no_aceptado",
          "Tiene que ser un webhook de Discord, Slack o Google Chat.",
        );
      }
      return responderConAjustes(contexto);
    }),
  );
}

export function probarElWebhook(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () => {
    const direccion = await contexto.ajustes.leer(CLAVE_DEL_WEBHOOK);
    if (direccion === null) {
      return responderError(409, "sin_webhook", "Todavía no guardaste ningún webhook.");
    }
    const evento = await contexto.almacen.leerEvento();
    const llego = await contexto.avisos.enviar(
      direccion,
      `🟢 Nativox: prueba de avisos${evento ? ` de «${evento.nombre}»` : ""}. Si ves esto, el canal quedó bien conectado.`,
    );
    return llego
      ? Response.json({ ok: true })
      : responderError(
          502,
          "webhook_sin_respuesta",
          "El canal no aceptó el mensaje. Revisá la dirección del webhook.",
        );
  });
}

// Lo que la sesión en vivo necesita saber de los ajustes (para el administrador y para los
// operadores, que no pueden leer los ajustes completos): solo las preferencias que aplica la
// computadora de la sala, sin el webhook ni el consumo.
export function leerPreferenciasDeSesion(
  pedido: Request,
  contexto: ContextoApi,
): Promise<Response> {
  return comoPersona(pedido, contexto, async () => {
    const { operacion, subtitulos } = await leerAjustesGuardados(contexto.ajustes);
    return Response.json({
      ok: true,
      autorreparacion: operacion.autorreparacion,
      arranqueConAgenda: operacion.arranqueConAgenda,
      corregirLineaAnterior: subtitulos.corregirLineaAnterior,
    });
  });
}
