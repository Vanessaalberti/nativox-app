import {
  esquemaCodigoNuevo,
  esquemaListaDeOperadores,
  esquemaOperadoresConCodigo,
  esquemaRespuestaSimple,
  esquemaUnOperador,
  type DatosDeOperador,
  type Operador,
  type OperadorConCodigo,
  type Resultado,
} from "@compartido/contratos";
import { llamar } from "./llamar";

export async function listarOperadores(): Promise<Resultado<Operador[]>> {
  const respuesta = await llamar("/api/operadores", esquemaListaDeOperadores);
  return respuesta.ok ? { ok: true, valor: respuesta.valor.operadores } : respuesta;
}

// Devuelve a cada persona con su código de invitación: es la única vez que se ve.
export async function invitarOperadores(
  personas: DatosDeOperador[],
): Promise<Resultado<OperadorConCodigo[]>> {
  const respuesta = await llamar("/api/operadores", esquemaOperadoresConCodigo, {
    metodo: "POST",
    cuerpo: { personas },
  });
  return respuesta.ok ? { ok: true, valor: respuesta.valor.operadores } : respuesta;
}

export async function actualizarOperador(
  id: number,
  datos: DatosDeOperador,
): Promise<Resultado<Operador>> {
  const respuesta = await llamar(`/api/operadores/${String(id)}`, esquemaUnOperador, {
    metodo: "PUT",
    cuerpo: datos,
  });
  return respuesta.ok ? { ok: true, valor: respuesta.valor.operador } : respuesta;
}

// Reemplaza el código de la persona (el anterior deja de servir) y devuelve el nuevo.
export async function nuevoCodigoDeOperador(id: number): Promise<Resultado<string>> {
  const respuesta = await llamar(`/api/operadores/${String(id)}/codigo`, esquemaCodigoNuevo, {
    metodo: "POST",
    cuerpo: {},
  });
  return respuesta.ok ? { ok: true, valor: respuesta.valor.codigo } : respuesta;
}

export async function borrarOperador(id: number): Promise<Resultado<null>> {
  const respuesta = await llamar(`/api/operadores/${String(id)}`, esquemaRespuestaSimple, {
    metodo: "DELETE",
  });
  return respuesta.ok ? { ok: true, valor: null } : respuesta;
}
