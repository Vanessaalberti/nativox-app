import { esquemaCrearOperadores, esquemaDatosDeOperador } from "@compartido/contratos";
import {
  generarCodigoDeInvitacion,
  hashearCodigoDeInvitacion,
} from "@servidor/modulos/cripto-acceso";
import { responderError } from "@servidor/plataforma/errores";
import { conCuerpo } from "@servidor/plataforma/pedido";
import { comoAdministrador, type ContextoApi } from "./sesion";

const personaInexistente = () =>
  responderError(404, "operador_inexistente", "Esa persona no existe.");

// Las salas que se le asignan tienen que existir: si no, el pedido se rechaza entero.
async function todasExisten(contexto: ContextoApi, salaIds: readonly string[]): Promise<boolean> {
  const existentes = new Set((await contexto.agenda.listarSalas()).map((sala) => sala.id));
  return salaIds.every((id) => existentes.has(id));
}

const salaInvalida = () =>
  responderError(400, "sala_inexistente", "Alguna de las salas elegidas no existe.");

export function listarOperadores(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () =>
    Response.json({ ok: true, operadores: await contexto.operadores.listarOperadores() }),
  );
}

// Suma a una o varias personas. Cada una recibe su código de invitación: viaja en esta respuesta
// y nunca más (en la base queda solo su hash).
export function crearOperadores(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaCrearOperadores, async ({ personas }) => {
      if (
        !(await todasExisten(
          contexto,
          personas.flatMap((persona) => persona.salaIds),
        ))
      ) {
        return salaInvalida();
      }

      const codigos = personas.map(() => generarCodigoDeInvitacion());
      const ids = await contexto.operadores.crearOperadores(
        await Promise.all(
          personas.map(async (persona, indice) => ({
            nombre: persona.nombre,
            salaIds: [...new Set(persona.salaIds)],
            codigoHash: await hashearCodigoDeInvitacion(codigos[indice] ?? ""),
          })),
        ),
        contexto.ahora(),
      );

      const creados = await Promise.all(
        ids.map(async (id, indice) => ({
          ...(await contexto.operadores.leerOperador(id)),
          codigo: codigos[indice] ?? "",
        })),
      );
      return Response.json({ ok: true, operadores: creados }, { status: 201 });
    }),
  );
}

export function actualizarOperador(
  pedido: Request,
  contexto: ContextoApi,
  id = "",
): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaDatosDeOperador, async (datos) => {
      if (!(await todasExisten(contexto, datos.salaIds))) return salaInvalida();

      const numero = Number(id);
      const salaIds = [...new Set(datos.salaIds)];
      if (!(await contexto.operadores.actualizarOperador(numero, datos.nombre, salaIds))) {
        return personaInexistente();
      }
      return Response.json({ ok: true, operador: await contexto.operadores.leerOperador(numero) });
    }),
  );
}

// Reemplaza el código: el anterior deja de servir y se cierran las sesiones abiertas con él.
export function nuevoCodigo(pedido: Request, contexto: ContextoApi, id = ""): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () => {
    const numero = Number(id);
    const codigo = generarCodigoDeInvitacion();
    if (
      !(await contexto.operadores.cambiarCodigo(numero, await hashearCodigoDeInvitacion(codigo)))
    ) {
      return personaInexistente();
    }
    await contexto.almacen.borrarSesionesDe("operador", numero);
    return Response.json({ ok: true, codigo });
  });
}

// Elimina a la persona: pierde el acceso al instante (se cierran sus sesiones).
export function borrarOperador(pedido: Request, contexto: ContextoApi, id = ""): Promise<Response> {
  return comoAdministrador(pedido, contexto, async () => {
    const numero = Number(id);
    if (!(await contexto.operadores.borrarOperador(numero))) return personaInexistente();
    await contexto.almacen.borrarSesionesDe("operador", numero);
    return Response.json({ ok: true });
  });
}
