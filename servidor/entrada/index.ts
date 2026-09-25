import { crearCuenta, ingresar, ingresarOperador, recuperar, salir } from "@servidor/api/acceso";
import { actualizarCharla, borrarCharla, crearCharla, listarCharlas } from "@servidor/api/agenda";
import { crearEvento, leerEvento, responderEstado } from "@servidor/api/evento";
import { responderSalud } from "@servidor/api/salud";
import { actualizarSala, borrarSala, crearSalas, leerSala, listarSalas } from "@servidor/api/salas";
import type { ContextoApi } from "@servidor/api/sesion";
import { crearAlmacenD1 } from "@servidor/plataforma/almacen-d1";
import { crearAlmacenAgendaD1 } from "@servidor/plataforma/almacen-agenda-d1";
import { responderError } from "@servidor/plataforma/errores";

export { Sala } from "@servidor/objetos-durables/sala/sala";
export { Produccion } from "@servidor/objetos-durables/produccion/produccion";

// Lo que captura la ruta (el id de la sala o de la charla) llega como argumento después del contexto.
type Manejador = (pedido: Request, contexto: ContextoApi, ...ids: string[]) => Promise<Response>;

interface Ruta {
  patron: RegExp;
  metodos: Partial<Record<string, Manejador>>;
}

const ID = "([0-9a-f]{12})";

// Cada recurso de /api con sus métodos. Una ruta con otro método responde 405.
const RUTAS: Ruta[] = [
  { patron: /^\/api\/estado$/, metodos: { GET: responderEstado } },
  { patron: /^\/api\/acceso\/cuenta$/, metodos: { POST: crearCuenta } },
  { patron: /^\/api\/acceso\/ingresar$/, metodos: { POST: ingresar } },
  { patron: /^\/api\/acceso\/recuperar$/, metodos: { POST: recuperar } },
  { patron: /^\/api\/acceso\/operador$/, metodos: { POST: ingresarOperador } },
  { patron: /^\/api\/acceso\/salir$/, metodos: { POST: salir } },
  { patron: /^\/api\/evento$/, metodos: { GET: leerEvento, POST: crearEvento } },
  { patron: /^\/api\/salas$/, metodos: { GET: listarSalas, POST: crearSalas } },
  {
    patron: new RegExp(`^/api/salas/${ID}$`),
    metodos: { GET: leerSala, PUT: actualizarSala, DELETE: borrarSala },
  },
  {
    patron: new RegExp(`^/api/salas/${ID}/charlas$`),
    metodos: { GET: listarCharlas, POST: crearCharla },
  },
  {
    patron: new RegExp(`^/api/charlas/${ID}$`),
    metodos: { PUT: actualizarCharla, DELETE: borrarCharla },
  },
];

export default {
  async fetch(pedido, env) {
    const url = new URL(pedido.url);

    if (url.pathname === "/api/salud") {
      return responderSalud();
    }

    for (const { patron, metodos } of RUTAS) {
      const coincidencia = patron.exec(url.pathname);
      if (!coincidencia) continue;

      const manejador = metodos[pedido.method];
      if (!manejador) {
        return responderError(405, "metodo_no_permitido", `${pedido.method} no está permitido acá`);
      }
      return manejador(
        pedido,
        {
          almacen: crearAlmacenD1(env.DB),
          agenda: crearAlmacenAgendaD1(env.DB),
          ahora: () => Date.now(),
          ip: pedido.headers.get("CF-Connecting-IP") ?? "sin-ip",
          segura: url.protocol === "https:",
        },
        ...coincidencia.slice(1),
      );
    }
    return responderError(404, "ruta_inexistente", `No existe la ruta ${url.pathname}`);
  },
} satisfies ExportedHandler<Env>;
