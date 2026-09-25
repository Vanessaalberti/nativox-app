import {
  esquemaListaDeCharlas,
  esquemaListaDeSalas,
  esquemaRespuestaSimple,
  esquemaUnaCharla,
  esquemaUnaSala,
  type Charla,
  type DatosDeCharla,
  type DatosDeSala,
  type Resultado,
  type Sala,
} from "@compartido/contratos";
import { llamar } from "./llamar";

// Se reenvía el motivo de un pedido fallido tal cual; solo se cambia lo que vuelve si salió bien.
function extraer<T, R>(respuesta: Resultado<T>, sacar: (valor: T) => R): Resultado<R> {
  return respuesta.ok ? { ok: true, valor: sacar(respuesta.valor) } : respuesta;
}

export async function listarSalas(): Promise<Resultado<Sala[]>> {
  return extraer(await llamar("/api/salas", esquemaListaDeSalas), (r) => r.salas);
}

export async function crearSalas(salas: DatosDeSala[]): Promise<Resultado<Sala[]>> {
  const respuesta = await llamar("/api/salas", esquemaListaDeSalas, {
    metodo: "POST",
    cuerpo: { salas },
  });
  return extraer(respuesta, (r) => r.salas);
}

export async function leerSala(id: string): Promise<Resultado<Sala>> {
  return extraer(await llamar(`/api/salas/${id}`, esquemaUnaSala), (r) => r.sala);
}

export async function actualizarSala(id: string, datos: DatosDeSala): Promise<Resultado<Sala>> {
  const respuesta = await llamar(`/api/salas/${id}`, esquemaUnaSala, {
    metodo: "PUT",
    cuerpo: datos,
  });
  return extraer(respuesta, (r) => r.sala);
}

export async function borrarSala(id: string): Promise<Resultado<null>> {
  const respuesta = await llamar(`/api/salas/${id}`, esquemaRespuestaSimple, { metodo: "DELETE" });
  return extraer(respuesta, () => null);
}

export async function listarCharlas(salaId: string): Promise<Resultado<Charla[]>> {
  const respuesta = await llamar(`/api/salas/${salaId}/charlas`, esquemaListaDeCharlas);
  return extraer(respuesta, (r) => r.charlas);
}

export async function crearCharla(
  salaId: string,
  datos: DatosDeCharla,
): Promise<Resultado<Charla>> {
  const respuesta = await llamar(`/api/salas/${salaId}/charlas`, esquemaUnaCharla, {
    metodo: "POST",
    cuerpo: datos,
  });
  return extraer(respuesta, (r) => r.charla);
}

export async function actualizarCharla(
  id: string,
  datos: DatosDeCharla,
): Promise<Resultado<Charla>> {
  const respuesta = await llamar(`/api/charlas/${id}`, esquemaUnaCharla, {
    metodo: "PUT",
    cuerpo: datos,
  });
  return extraer(respuesta, (r) => r.charla);
}

export async function borrarCharla(id: string): Promise<Resultado<null>> {
  const respuesta = await llamar(`/api/charlas/${id}`, esquemaRespuestaSimple, {
    metodo: "DELETE",
  });
  return extraer(respuesta, () => null);
}
