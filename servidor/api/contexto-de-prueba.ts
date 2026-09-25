import { esquemaRespuestaConCodigo, validar } from "@compartido/contratos";
import { crearAlmacenAgendaEnMemoria } from "@servidor/plataforma/almacen-agenda-en-memoria";
import { crearAlmacenEnMemoria } from "@servidor/plataforma/almacen-en-memoria";
import { crearCuenta } from "./acceso";
import type { ContextoApi } from "./sesion";

// Lo que comparten las pruebas de la API: un contexto con todo en memoria, pedidos armados a mano
// y una cuenta de administrador ya abierta.
export const CONTRASENA_DE_PRUEBA = "una frase bien larga";

export function crearContextoDePrueba(): ContextoApi & { reloj: number } {
  const contexto = {
    reloj: 1_000_000,
    almacen: crearAlmacenEnMemoria(),
    agenda: crearAlmacenAgendaEnMemoria(),
    ahora: () => contexto.reloj,
    ip: "1.2.3.4",
    segura: true,
  };
  return contexto;
}

export function pedido(ruta: string, cuerpo?: unknown, cookie?: string, metodo = "POST"): Request {
  const encabezados = new Headers({ "Content-Type": "application/json" });
  if (cookie) encabezados.set("Cookie", cookie);
  const init: RequestInit = { method: metodo, headers: encabezados };
  if (cuerpo !== undefined) init.body = JSON.stringify(cuerpo);
  return new Request(`https://nativox.test${ruta}`, init);
}

// La cookie que devolvió el servidor, lista para mandarla en el pedido siguiente.
function cookieDe(respuesta: Response): string {
  return (respuesta.headers.get("Set-Cookie") ?? "").split(";")[0] ?? "";
}

export async function abrirCuenta(
  contexto: ContextoApi,
): Promise<{ cookie: string; codigo: string }> {
  const respuesta = await crearCuenta(
    pedido("/api/acceso/cuenta", {
      email: "Vos@TuEvento.com",
      contrasena: CONTRASENA_DE_PRUEBA,
    }),
    contexto,
  );
  const cuerpo = validar(esquemaRespuestaConCodigo, await respuesta.json());
  if (!cuerpo.ok) throw new Error(`La cuenta de prueba no se creó: ${cuerpo.motivo}`);
  return { cookie: cookieDe(respuesta), codigo: cuerpo.valor.codigoRecuperacion };
}
