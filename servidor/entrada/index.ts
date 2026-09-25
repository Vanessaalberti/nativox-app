import { crearCuenta, ingresar, ingresarOperador, recuperar, salir } from "@servidor/api/acceso";
import { crearEvento, leerEvento, responderEstado } from "@servidor/api/evento";
import { responderSalud } from "@servidor/api/salud";
import type { ContextoApi } from "@servidor/api/sesion";
import { crearAlmacenD1 } from "@servidor/plataforma/almacen-d1";
import { responderError } from "@servidor/plataforma/errores";

export { Sala } from "@servidor/objetos-durables/sala/sala";
export { Produccion } from "@servidor/objetos-durables/produccion/produccion";

type Manejador = (pedido: Request, contexto: ContextoApi) => Promise<Response>;

// Método y ruta de cada recurso de /api. Una ruta con otro método responde 405.
const RUTAS: Record<string, Partial<Record<string, Manejador>>> = {
  "/api/estado": { GET: responderEstado },
  "/api/acceso/cuenta": { POST: crearCuenta },
  "/api/acceso/ingresar": { POST: ingresar },
  "/api/acceso/recuperar": { POST: recuperar },
  "/api/acceso/operador": { POST: ingresarOperador },
  "/api/acceso/salir": { POST: salir },
  "/api/evento": { GET: leerEvento, POST: crearEvento },
};

export default {
  async fetch(pedido, env) {
    const url = new URL(pedido.url);

    if (url.pathname === "/api/salud") {
      return responderSalud();
    }

    const rutas = Object.hasOwn(RUTAS, url.pathname) ? RUTAS[url.pathname] : undefined;
    if (!rutas) {
      return responderError(404, "ruta_inexistente", `No existe la ruta ${url.pathname}`);
    }
    const manejador = rutas[pedido.method];
    if (!manejador) {
      return responderError(405, "metodo_no_permitido", `${pedido.method} no está permitido acá`);
    }

    return manejador(pedido, {
      almacen: crearAlmacenD1(env.DB),
      ahora: () => Date.now(),
      ip: pedido.headers.get("CF-Connecting-IP") ?? "sin-ip",
      segura: url.protocol === "https:",
    });
  },
} satisfies ExportedHandler<Env>;
