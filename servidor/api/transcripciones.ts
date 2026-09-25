import { conSala, salaInexistente } from "./con-sala";
import type { ContextoApi } from "./sesion";
import { comoAdministrador } from "./sesion";

// GET /api/charlas/:id/transcripcion — lo que se transcribió de una charla, en orden. La ve el
// administrador o el operador de esa sala.
export async function leerTranscripcion(
  pedido: Request,
  contexto: ContextoApi,
  charlaId = "",
): Promise<Response> {
  const charla = await contexto.agenda.leerCharla(charlaId);
  if (!charla) return salaInexistente();
  return conSala(pedido, contexto, charla.salaId, async () =>
    Response.json({ ok: true, segmentos: await contexto.operacion.listarSegmentos(charlaId) }),
  );
}

// GET /api/salidas/registro — qué sala estuvo al aire en cada salida y desde cuándo.
export function leerRegistroDeAire(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () => {
    const [entradas, salas] = await Promise.all([
      contexto.operacion.listarAire(50),
      contexto.agenda.listarSalas(),
    ]);
    const nombres = new Map(salas.map((sala) => [sala.id, sala.nombre]));
    return Response.json({
      ok: true,
      entradas: entradas.map((entrada) => ({
        salida: entrada.salida,
        sala: entrada.salaId === null ? null : (nombres.get(entrada.salaId) ?? "Sala eliminada"),
        desde: entrada.desde,
      })),
    });
  });
}
