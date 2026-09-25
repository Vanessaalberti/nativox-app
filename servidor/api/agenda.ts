import { esquemaDatosDeCharla, type Charla } from "@compartido/contratos";
import { responderError } from "@servidor/plataforma/errores";
import { crearId } from "@servidor/plataforma/ids";
import { conCuerpo } from "@servidor/plataforma/pedido";
import { salaInexistente } from "./salas";
import { comoAdministrador, type ContextoApi } from "./sesion";

const charlaInexistente = () => responderError(404, "charla_inexistente", "Esa charla no existe.");

const hora = (minutos: number) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

// En una misma sala no puede haber dos charlas a la vez (una que empieza cuando la otra termina
// está bien). Devuelve con cuál se pisa, si se pisa con alguna.
function buscarSuperposicion(
  charlas: Charla[],
  nueva: { fecha: string; inicioMin: number; finMin: number },
  ignorar?: string,
): Charla | undefined {
  return charlas.find(
    (charla) =>
      charla.id !== ignorar &&
      charla.fecha === nueva.fecha &&
      charla.inicioMin < nueva.finMin &&
      nueva.inicioMin < charla.finMin,
  );
}

const respuestaDeSuperposicion = (charla: Charla) =>
  responderError(
    409,
    "charla_superpuesta",
    `Se superpone con «${charla.titulo}» (${hora(charla.inicioMin)}–${hora(charla.finMin)}) en esta sala.`,
  );

export function listarCharlas(
  pedido: Request,
  contexto: ContextoApi,
  salaId = "",
): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () => {
    if (!(await contexto.agenda.leerSala(salaId))) return salaInexistente();
    return Response.json({ ok: true, charlas: await contexto.agenda.listarCharlas(salaId) });
  });
}

export function crearCharla(
  pedido: Request,
  contexto: ContextoApi,
  salaId = "",
): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaDatosDeCharla, async (datos) => {
      if (!(await contexto.agenda.leerSala(salaId))) return salaInexistente();

      const pisada = buscarSuperposicion(await contexto.agenda.listarCharlas(salaId), datos);
      if (pisada) return respuestaDeSuperposicion(pisada);

      const id = crearId();
      await contexto.agenda.crearCharla(id, salaId, datos, contexto.ahora());
      return Response.json(
        { ok: true, charla: await contexto.agenda.leerCharla(id) },
        { status: 201 },
      );
    }),
  );
}

export function actualizarCharla(
  pedido: Request,
  contexto: ContextoApi,
  id = "",
): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaDatosDeCharla, async (datos) => {
      const actual = await contexto.agenda.leerCharla(id);
      if (!actual) return charlaInexistente();

      const pisada = buscarSuperposicion(
        await contexto.agenda.listarCharlas(actual.salaId),
        datos,
        id,
      );
      if (pisada) return respuestaDeSuperposicion(pisada);

      await contexto.agenda.actualizarCharla(id, datos);
      return Response.json({ ok: true, charla: await contexto.agenda.leerCharla(id) });
    }),
  );
}

export function borrarCharla(pedido: Request, contexto: ContextoApi, id = ""): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () =>
    (await contexto.agenda.borrarCharla(id)) ? Response.json({ ok: true }) : charlaInexistente(),
  );
}
