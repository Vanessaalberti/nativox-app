import {
  esquemaEstadoDeLaInstancia,
  esquemaEventoCompleto,
  esquemaRespuestaConCodigo,
  esquemaRespuestaSimple,
  type CrearCuenta,
  type DatosEvento,
  type EstadoDeLaInstancia,
  type EventoCompleto,
  type Ingresar,
  type Recuperar,
  type Resultado,
} from "@compartido/contratos";
import { llamar } from "./llamar";

// Las respuestas de "ok" sin datos no le sirven a nadie: se devuelve null.
async function sinDatos(ruta: string, cuerpo: unknown): Promise<Resultado<null>> {
  const respuesta = await llamar(ruta, esquemaRespuestaSimple, { metodo: "POST", cuerpo });
  return respuesta.ok ? { ok: true, valor: null } : respuesta;
}

// Crear la cuenta y recuperarla devuelven el código de recuperación, que no se vuelve a mostrar.
async function conCodigo(ruta: string, cuerpo: unknown): Promise<Resultado<{ codigo: string }>> {
  const respuesta = await llamar(ruta, esquemaRespuestaConCodigo, { metodo: "POST", cuerpo });
  return respuesta.ok
    ? { ok: true, valor: { codigo: respuesta.valor.codigoRecuperacion } }
    : respuesta;
}

export function leerEstado(): Promise<Resultado<EstadoDeLaInstancia>> {
  return llamar("/api/estado", esquemaEstadoDeLaInstancia);
}

export const crearCuenta = (datos: CrearCuenta) => conCodigo("/api/acceso/cuenta", datos);

export const recuperar = (datos: Recuperar) => conCodigo("/api/acceso/recuperar", datos);

export const ingresar = (datos: Ingresar) => sinDatos("/api/acceso/ingresar", datos);

export const ingresarComoOperador = (codigo: string) =>
  sinDatos("/api/acceso/operador", { codigo });

export const salir = () => sinDatos("/api/acceso/salir", {});

export const crearEvento = (datos: DatosEvento) => sinDatos("/api/evento", datos);

export async function leerEvento(): Promise<Resultado<{ evento: EventoCompleto; email: string }>> {
  const respuesta = await llamar("/api/evento", esquemaEventoCompleto);
  return respuesta.ok
    ? { ok: true, valor: { evento: respuesta.valor.evento, email: respuesta.valor.email } }
    : respuesta;
}
