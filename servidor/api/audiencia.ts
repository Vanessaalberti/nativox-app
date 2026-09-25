import type { Audiencia } from "@compartido/contratos";
import { generarToken } from "@servidor/modulos/cripto-acceso";
import { responderError } from "@servidor/plataforma/errores";
import { comoAdministrador, sesionDe, type ContextoApi } from "./sesion";

const CLAVE_DEL_ENLACE = "enlace_audiencia";

// Quien conoce el link (/a/<token>) o quien ya tiene sesión (el administrador y los operadores,
// que llegan desde su propio panel y no tienen el link). El link lo genera el administrador y lo
// comparte a mano: la pantalla de entrada de la instancia no lleva a la audiencia.
async function puedeVerLaAudiencia(pedido: Request, contexto: ContextoApi): Promise<boolean> {
  const token = new URL(pedido.url).searchParams.get("t");
  const guardado = await contexto.ajustes.leer(CLAVE_DEL_ENLACE);
  if (token !== null && guardado !== null && token === guardado) return true;
  return (await sesionDe(pedido, contexto)) !== null;
}

async function tokenDelEnlace(contexto: ContextoApi, renovar: boolean): Promise<string> {
  const guardado = renovar ? null : await contexto.ajustes.leer(CLAVE_DEL_ENLACE);
  if (guardado !== null) return guardado;
  const nuevo = generarToken();
  await contexto.ajustes.guardar(CLAVE_DEL_ENLACE, nuevo);
  return nuevo;
}

// GET /api/audiencia/enlace — el link vigente (se crea la primera vez). Solo el administrador.
export const responderEnlaceDeAudiencia = (pedido: Request, contexto: ContextoApi) =>
  comoAdministrador(pedido, contexto, async () =>
    Response.json({ ok: true, token: await tokenDelEnlace(contexto, false) }),
  );

// POST /api/audiencia/enlace — genera uno nuevo: el anterior deja de servir.
export const renovarEnlaceDeAudiencia = (pedido: Request, contexto: ContextoApi) =>
  comoAdministrador(pedido, contexto, async () =>
    Response.json({ ok: true, token: await tokenDelEnlace(contexto, true) }),
  );

// Lo que ve la audiencia: el evento, sus salas (si están en vivo) y sus charlas. No necesita
// cuenta, pero sí el link del administrador; no incluye glosarios ni equipo.
export async function responderAudiencia(
  pedido: Request,
  contexto: ContextoApi,
): Promise<Response> {
  if (!(await puedeVerLaAudiencia(pedido, contexto))) {
    return responderError(404, "enlace_invalido", "Este link no existe o ya no sirve.");
  }
  const [evento, salas] = await Promise.all([
    contexto.almacen.leerEvento(),
    contexto.agenda.listarSalas(),
  ]);

  const publicas = await Promise.all(
    salas.map(async (sala) => {
      const [charlas, vivo] = await Promise.all([
        contexto.agenda.listarCharlas(sala.id),
        contexto.tiempoReal.resumen(sala.id),
      ]);
      return {
        id: sala.id,
        nombre: sala.nombre,
        idiomaOriginal: sala.idiomaOriginal,
        idiomasDestino: sala.idiomasDestino,
        enVivo: vivo.enVivo,
        // Solo lo que es público: sin el glosario ni el id de la sala.
        charlas: charlas.map((charla) => ({
          id: charla.id,
          titulo: charla.titulo,
          resumen: charla.resumen,
          oradores: charla.oradores,
          fecha: charla.fecha,
          inicioMin: charla.inicioMin,
          finMin: charla.finMin,
          idioma: charla.idioma,
        })),
      };
    }),
  );

  const cuerpo: Audiencia = {
    ok: true,
    evento: evento ? { nombre: evento.nombre, logo: evento.logo } : null,
    salas: publicas,
  };
  return Response.json(cuerpo);
}
