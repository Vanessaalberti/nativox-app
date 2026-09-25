import {
  esquemaRespuestaAjustes,
  esquemaRespuestaConCodigo,
  esquemaRespuestaSimple,
  type ActualizarEvento,
  type Ajustes,
  type Resultado,
} from "@compartido/contratos";
import { llamar } from "./llamar";

export interface AjustesLeidos {
  ajustes: Ajustes;
  webhookConfigurado: boolean;
}

const sinDatos = <T extends { ok: true }>(respuesta: Resultado<T>): Resultado<null> =>
  respuesta.ok ? { ok: true, valor: null } : respuesta;

export async function leerAjustes(): Promise<Resultado<AjustesLeidos>> {
  return llamar("/api/ajustes", esquemaRespuestaAjustes);
}

export async function guardarAjustes(ajustes: Ajustes): Promise<Resultado<AjustesLeidos>> {
  return llamar("/api/ajustes", esquemaRespuestaAjustes, { metodo: "PUT", cuerpo: ajustes });
}

// La dirección se guarda en el servidor y nunca vuelve; null borra el webhook.
export async function guardarWebhook(url: string | null): Promise<Resultado<AjustesLeidos>> {
  return llamar("/api/ajustes/webhook", esquemaRespuestaAjustes, {
    metodo: "PUT",
    cuerpo: { url },
  });
}

export async function probarWebhook(): Promise<Resultado<null>> {
  return sinDatos(
    await llamar("/api/ajustes/webhook/probar", esquemaRespuestaSimple, {
      metodo: "POST",
      cuerpo: {},
    }),
  );
}

export async function actualizarEvento(cambios: ActualizarEvento): Promise<Resultado<null>> {
  return sinDatos(
    await llamar("/api/evento", esquemaRespuestaSimple, { metodo: "PUT", cuerpo: cambios }),
  );
}

export async function eliminarEvento(nombre: string): Promise<Resultado<null>> {
  return sinDatos(
    await llamar("/api/evento", esquemaRespuestaSimple, { metodo: "DELETE", cuerpo: { nombre } }),
  );
}

export async function cambiarContrasena(actual: string, nueva: string): Promise<Resultado<null>> {
  return sinDatos(
    await llamar("/api/acceso/contrasena", esquemaRespuestaSimple, {
      metodo: "POST",
      cuerpo: { actual, nueva },
    }),
  );
}

// Devuelve el código nuevo, que no se vuelve a mostrar.
export async function generarCodigoDeRecuperacion(contrasena: string): Promise<Resultado<string>> {
  const respuesta = await llamar("/api/acceso/codigo-de-recuperacion", esquemaRespuestaConCodigo, {
    metodo: "POST",
    cuerpo: { contrasena },
  });
  return respuesta.ok ? { ok: true, valor: respuesta.valor.codigoRecuperacion } : respuesta;
}
