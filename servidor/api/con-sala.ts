import type { Sala } from "@compartido/contratos";
import type { SesionGuardada } from "@servidor/plataforma/almacen-acceso";
import { responderError } from "@servidor/plataforma/errores";
import { comoPersona, puedeVerSala, type ContextoApi } from "./sesion";

const sinPermisoSobreLaSala = () =>
  responderError(403, "sin_permiso", "No tenés acceso a esta sala.");

export const salaInexistente = () => responderError(404, "sala_inexistente", "Esa sala no existe.");

// Corre la acción con la sala pedida, si existe y quien pregunta la puede ver (el administrador ve
// todas; un operador, solo las suyas).
export function conSala(
  pedido: Request,
  contexto: ContextoApi,
  salaId: string,
  accion: (sala: Sala, sesion: SesionGuardada) => Promise<Response>,
): Promise<Response> {
  return comoPersona(pedido, contexto, async (sesion) => {
    if (!(await puedeVerSala(contexto, sesion, salaId))) return sinPermisoSobreLaSala();
    const sala = await contexto.agenda.leerSala(salaId);
    return sala ? accion(sala, sesion) : salaInexistente();
  });
}
