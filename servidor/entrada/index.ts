import {
  cambiarContrasena,
  crearCuenta,
  ingresar,
  ingresarOperador,
  nuevoCodigoDeRecuperacion,
  recuperar,
  salir,
} from "@servidor/api/acceso";
import {
  guardarElWebhook,
  guardarLosAjustes,
  leerLosAjustes,
  leerPreferenciasDeSesion,
  probarElWebhook,
} from "@servidor/api/ajustes";
import { actualizarCharla, borrarCharla, crearCharla, listarCharlas } from "@servidor/api/agenda";
import {
  actualizarEvento,
  crearEvento,
  eliminarEvento,
  leerEvento,
  responderEstado,
} from "@servidor/api/evento";
import {
  actualizarOperador,
  borrarOperador,
  crearOperadores,
  listarOperadores,
  nuevoCodigo,
} from "@servidor/api/operadores";
import { confirmarAccion, verAccion } from "@servidor/api/acciones";
import {
  renovarEnlaceDeAudiencia,
  responderAudiencia,
  responderEnlaceDeAudiencia,
} from "@servidor/api/audiencia";
import {
  actualizarSalida,
  borrarSalida,
  crearSalida,
  guardarEstiloDeSala,
  listarSalidas,
  responderSalidaPublica,
  responderTransmisionDeSala,
} from "@servidor/api/produccion";
import { responderSalud } from "@servidor/api/salud";
import { transcribir } from "@servidor/api/transcribir";
import { actualizarSala, borrarSala, crearSalas, leerSala, listarSalas } from "@servidor/api/salas";
import type { ContextoApi } from "@servidor/api/sesion";
import { abrirSala } from "@servidor/api/tiempo-real";
import { leerRegistroDeAire, leerTranscripcion } from "@servidor/api/transcripciones";
import { crearAlmacenD1 } from "@servidor/plataforma/almacen-d1";
import { crearAlmacenAjustesD1 } from "@servidor/plataforma/almacen-ajustes-d1";
import { crearAlmacenAgendaD1 } from "@servidor/plataforma/almacen-agenda-d1";
import { crearAlmacenOperacionD1 } from "@servidor/plataforma/almacen-operacion-d1";
import { crearAlmacenOperadoresD1 } from "@servidor/plataforma/almacen-operadores-d1";
import { crearAvisosPorWebhook } from "@servidor/plataforma/avisos-por-webhook";
import { crearAlmacenProduccionD1 } from "@servidor/plataforma/almacen-produccion-d1";
import { responderError } from "@servidor/plataforma/errores";
import { ENCABEZADO_DE_SALA, type TiempoReal } from "@servidor/plataforma/tiempo-real";
import { crearTranscriptorWorkersAi } from "@servidor/plataforma/transcriptor-workers-ai";

export { Sala } from "@servidor/objetos-durables/sala/sala";
export { Produccion } from "@servidor/objetos-durables/produccion/produccion";

// Lo que captura la ruta (el id de la sala, de la charla o de la persona) llega como argumento
// después del contexto.
type Manejador = (pedido: Request, contexto: ContextoApi, ...ids: string[]) => Promise<Response>;

interface Ruta {
  patron: RegExp;
  metodos: Partial<Record<string, Manejador>>;
}

// Las salas y las charlas tienen ids de 12 caracteres hexadecimales; las personas, un número.
const ID = "([0-9a-f]{12})";
const NUMERO = "(\\d+)";
// Los links de los avisos: 256 bits en hexadecimal.
const TOKEN = "([0-9a-f]{64})";

// Cada recurso de /api con sus métodos. Una ruta con otro método responde 405.
const RUTAS: Ruta[] = [
  { patron: /^\/api\/estado$/, metodos: { GET: responderEstado } },
  { patron: /^\/api\/audiencia$/, metodos: { GET: responderAudiencia } },
  { patron: /^\/api\/transcribir$/, metodos: { POST: transcribir } },
  {
    patron: /^\/api\/audiencia\/enlace$/,
    metodos: { GET: responderEnlaceDeAudiencia, POST: renovarEnlaceDeAudiencia },
  },
  { patron: /^\/api\/acceso\/cuenta$/, metodos: { POST: crearCuenta } },
  { patron: /^\/api\/acceso\/ingresar$/, metodos: { POST: ingresar } },
  { patron: /^\/api\/acceso\/recuperar$/, metodos: { POST: recuperar } },
  { patron: /^\/api\/acceso\/operador$/, metodos: { POST: ingresarOperador } },
  { patron: /^\/api\/acceso\/salir$/, metodos: { POST: salir } },
  { patron: /^\/api\/acceso\/contrasena$/, metodos: { POST: cambiarContrasena } },
  {
    patron: /^\/api\/acceso\/codigo-de-recuperacion$/,
    metodos: { POST: nuevoCodigoDeRecuperacion },
  },
  {
    patron: /^\/api\/evento$/,
    metodos: {
      GET: leerEvento,
      POST: crearEvento,
      PUT: actualizarEvento,
      DELETE: eliminarEvento,
    },
  },
  { patron: /^\/api\/ajustes$/, metodos: { GET: leerLosAjustes, PUT: guardarLosAjustes } },
  { patron: /^\/api\/ajustes\/webhook$/, metodos: { PUT: guardarElWebhook } },
  { patron: /^\/api\/sesion\/preferencias$/, metodos: { GET: leerPreferenciasDeSesion } },
  { patron: /^\/api\/ajustes\/webhook\/probar$/, metodos: { POST: probarElWebhook } },
  { patron: /^\/api\/salas$/, metodos: { GET: listarSalas, POST: crearSalas } },
  {
    patron: new RegExp(`^/api/salas/${ID}$`),
    metodos: { GET: leerSala, PUT: actualizarSala, DELETE: borrarSala },
  },
  { patron: new RegExp(`^/api/salas/${ID}/ws$`), metodos: { GET: abrirSala } },
  { patron: new RegExp(`^/api/salas/${ID}/estilo$`), metodos: { PUT: guardarEstiloDeSala } },
  {
    patron: new RegExp(`^/api/publico/salas/${ID}/transmision$`),
    metodos: { GET: responderTransmisionDeSala },
  },
  { patron: /^\/api\/salidas$/, metodos: { GET: listarSalidas, POST: crearSalida } },
  { patron: /^\/api\/salidas\/registro$/, metodos: { GET: leerRegistroDeAire } },
  {
    patron: new RegExp(`^/api/charlas/${ID}/transcripcion$`),
    metodos: { GET: leerTranscripcion },
  },
  {
    patron: new RegExp(`^/api/publico/acciones/${TOKEN}$`),
    metodos: { GET: verAccion, POST: confirmarAccion },
  },
  {
    patron: new RegExp(`^/api/salidas/${NUMERO}$`),
    metodos: { PUT: actualizarSalida, DELETE: borrarSalida },
  },
  {
    patron: new RegExp(`^/api/publico/salidas/${NUMERO}$`),
    metodos: { GET: responderSalidaPublica },
  },
  {
    patron: new RegExp(`^/api/salas/${ID}/charlas$`),
    metodos: { GET: listarCharlas, POST: crearCharla },
  },
  {
    patron: new RegExp(`^/api/charlas/${ID}$`),
    metodos: { PUT: actualizarCharla, DELETE: borrarCharla },
  },
  { patron: /^\/api\/operadores$/, metodos: { GET: listarOperadores, POST: crearOperadores } },
  {
    patron: new RegExp(`^/api/operadores/${NUMERO}$`),
    metodos: { PUT: actualizarOperador, DELETE: borrarOperador },
  },
  { patron: new RegExp(`^/api/operadores/${NUMERO}/codigo$`), metodos: { POST: nuevoCodigo } },
];

// La sala en tiempo real (un Durable Object por sala) vista desde la API.
function tiempoRealDe(env: Env): TiempoReal {
  const sala = (salaId: string) => env.SALA.get(env.SALA.idFromName(salaId));
  return {
    conectar: (salaId, pedido) => {
      const conSala = new Request(pedido);
      conSala.headers.set(ENCABEZADO_DE_SALA, salaId);
      return sala(salaId).fetch(conSala);
    },
    resumen: (salaId) => sala(salaId).resumen(),
    comando: (salaId, accion) => sala(salaId).mandarComando(accion),
  };
}

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
          operadores: crearAlmacenOperadoresD1(env.DB),
          tiempoReal: tiempoRealDe(env),
          transcriptor: crearTranscriptorWorkersAi(env.AI),
          produccion: crearAlmacenProduccionD1(env.DB),
          operacion: crearAlmacenOperacionD1(env.DB),
          ajustes: crearAlmacenAjustesD1(env.DB),
          avisos: crearAvisosPorWebhook(),
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
