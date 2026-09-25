import { esquemaCrearSalas, esquemaDatosDeSala } from "@compartido/contratos";
import { crearId } from "@servidor/plataforma/ids";
import { conCuerpo } from "@servidor/plataforma/pedido";
import { salaInexistente, conSala } from "./con-sala";
import { comoAdministrador, comoPersona, type ContextoApi } from "./sesion";

// El administrador ve todas las salas; un operador, solo las que le asignaron.
export function listarSalas(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoPersona(pedido, contexto, async (sesion) => {
    const salas = await contexto.agenda.listarSalas();
    const asignadas =
      sesion.rol === "administrador" ? null : await contexto.operadores.salasDe(sesion.cuentaId);
    return Response.json({
      ok: true,
      salas: asignadas === null ? salas : salas.filter((sala) => asignadas.includes(sala.id)),
    });
  });
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
  return conSala(pedido, contexto, id, (sala) =>
    Promise.resolve(Response.json({ ok: true, sala })),
  );
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
