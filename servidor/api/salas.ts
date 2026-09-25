import { esquemaCrearSalas, esquemaDatosDeSala } from "@compartido/contratos";
import { responderError } from "@servidor/plataforma/errores";
import { crearId } from "@servidor/plataforma/ids";
import { conCuerpo } from "@servidor/plataforma/pedido";
import { comoAdministrador, type ContextoApi } from "./sesion";

export const salaInexistente = () => responderError(404, "sala_inexistente", "Esa sala no existe.");

export function listarSalas(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () =>
    Response.json({ ok: true, salas: await contexto.agenda.listarSalas() }),
  );
}

// Crea una sala o varias de una (hasta 60): todas o ninguna.
export function crearSalas(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaCrearSalas, async ({ salas }) => {
      const nuevas = salas.map((sala) => ({ ...sala, id: crearId() }));
      await contexto.agenda.crearSalas(nuevas, contexto.ahora());
      const ids = new Set(nuevas.map((sala) => sala.id));
      const creadas = (await contexto.agenda.listarSalas()).filter((sala) => ids.has(sala.id));
      return Response.json({ ok: true, salas: creadas }, { status: 201 });
    }),
  );
}

export function leerSala(pedido: Request, contexto: ContextoApi, id = ""): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () => {
    const sala = await contexto.agenda.leerSala(id);
    return sala ? Response.json({ ok: true, sala }) : salaInexistente();
  });
}

export function actualizarSala(pedido: Request, contexto: ContextoApi, id = ""): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaDatosDeSala, async (datos) => {
      if (!(await contexto.agenda.actualizarSala(id, datos))) return salaInexistente();
      const sala = await contexto.agenda.leerSala(id);
      return sala ? Response.json({ ok: true, sala }) : salaInexistente();
    }),
  );
}

// Borra la sala y todas sus charlas.
export function borrarSala(pedido: Request, contexto: ContextoApi, id = ""): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () =>
    (await contexto.agenda.borrarSala(id)) ? Response.json({ ok: true }) : salaInexistente(),
  );
}
