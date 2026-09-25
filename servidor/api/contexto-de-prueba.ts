import { beforeEach } from "vitest";
import {
  esquemaListaDeSalas,
  esquemaOperadoresConCodigo,
  esquemaRespuestaConCodigo,
  validar,
  type Sala,
} from "@compartido/contratos";
import type { Avisos } from "@servidor/plataforma/avisos";
import { crearAlmacenAjustesEnMemoria } from "@servidor/plataforma/almacen-ajustes-en-memoria";
import { crearAlmacenAgendaEnMemoria } from "@servidor/plataforma/almacen-agenda-en-memoria";
import type { TiempoReal } from "@servidor/plataforma/tiempo-real";
import type { Transcriptor } from "@servidor/plataforma/transcriptor";
import { crearAlmacenProduccionEnMemoria } from "@servidor/plataforma/almacen-produccion-en-memoria";
import { crearAlmacenOperacionEnMemoria } from "@servidor/plataforma/almacen-operacion-en-memoria";
import { crearAlmacenOperadoresEnMemoria } from "@servidor/plataforma/almacen-operadores-en-memoria";
import { crearAlmacenEnMemoria } from "@servidor/plataforma/almacen-en-memoria";
import { crearCuenta, ingresarOperador } from "./acceso";
import { crearOperadores } from "./operadores";
import { crearSalas } from "./salas";
import type { ContextoApi } from "./sesion";

// Lo que comparten las pruebas de la API: un contexto con todo en memoria, pedidos armados a mano
// y una cuenta de administrador ya abierta.
export const CONTRASENA_DE_PRUEBA = "una frase bien larga";

// La sala en tiempo real de mentira: guarda a qué sala y con qué rol se conectaron y qué salas
// están "en vivo".
// Un transcriptor de mentira: devuelve siempre el mismo texto y anota qué se le pidió.
export interface TranscriptorFalso extends Transcriptor {
  pedidos: { idioma: string; prompt: string; bytes: number }[];
  falla: boolean;
}

function crearTranscriptorFalso(): TranscriptorFalso {
  const falso: TranscriptorFalso = {
    pedidos: [],
    falla: false,
    transcribir: ({ audio, idioma, prompt }) => {
      falso.pedidos.push({ idioma, prompt, bytes: audio.length });
      if (falso.falla) return Promise.reject(new Error("el modelo no contestó"));
      return Promise.resolve({
        texto: "hola a todos",
        palabras: [{ palabra: " hola", inicio: 0, fin: 0.4 }],
      });
    },
  };
  return falso;
}

export interface TiempoRealFalso extends TiempoReal {
  conexiones: { salaId: string; rol: string | null }[];
  enVivo: Set<string>;
  comandos: { salaId: string; accion: string }[];
  // Cuántas computadoras están conectadas a cualquier sala (para probar los comandos).
  publicando: number;
}

// Los avisos de mentira: guardan lo que se mandó y a dónde. `llegan` dice si el canal lo acepta.
export interface AvisosFalsos extends Avisos {
  enviados: { direccion: string; texto: string }[];
  llegan: boolean;
}

function crearAvisosFalsos(): AvisosFalsos {
  const falsos: AvisosFalsos = {
    enviados: [],
    llegan: true,
    enviar: (direccion, texto) => {
      falsos.enviados.push({ direccion, texto });
      return Promise.resolve(falsos.llegan);
    },
  };
  return falsos;
}

function crearTiempoRealFalso(): TiempoRealFalso {
  const falso: TiempoRealFalso = {
    conexiones: [],
    enVivo: new Set(),
    comandos: [],
    publicando: 1,
    conectar: (salaId, pedido) => {
      falso.conexiones.push({ salaId, rol: pedido.headers.get("X-Nativox-Rol") });
      return Promise.resolve(new Response("conectado", { status: 200 }));
    },
    resumen: (salaId) => Promise.resolve({ enVivo: falso.enVivo.has(salaId), espectadores: 0 }),
    comando: (salaId, accion) => {
      falso.comandos.push({ salaId, accion });
      return Promise.resolve({ publicando: falso.publicando });
    },
  };
  return falso;
}

export function crearContextoDePrueba(): ContextoApi & {
  reloj: number;
  tiempoReal: TiempoRealFalso;
  transcriptor: TranscriptorFalso;
  avisos: AvisosFalsos;
} {
  const agenda = crearAlmacenAgendaEnMemoria();
  const contexto = {
    reloj: 1_000_000,
    almacen: crearAlmacenEnMemoria(),
    agenda,
    produccion: crearAlmacenProduccionEnMemoria(async () =>
      (await agenda.listarSalas()).map((sala) => sala.id),
    ),
    operadores: crearAlmacenOperadoresEnMemoria(),
    tiempoReal: crearTiempoRealFalso(),
    transcriptor: crearTranscriptorFalso(),
    operacion: crearAlmacenOperacionEnMemoria(),
    ajustes: crearAlmacenAjustesEnMemoria(),
    avisos: crearAvisosFalsos(),
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

// Una cuenta de administrador con salas ya creadas (todas se hablan en español y se traducen al
// inglés). Devuelve la cookie del administrador y las salas.
async function abrirCuentaConSalas(
  contexto: ContextoApi,
  nombres: string[],
): Promise<{ cookie: string; salas: Sala[] }> {
  const { cookie } = await abrirCuenta(contexto);
  const respuesta = await crearSalas(
    pedido(
      "/api/salas",
      {
        salas: nombres.map((nombre) => ({
          nombre,
          idiomaOriginal: "es",
          idiomasDestino: ["en"],
        })),
      },
      cookie,
    ),
    contexto,
  );
  const cuerpo = validar(esquemaListaDeSalas, await respuesta.json());
  if (!cuerpo.ok) throw new Error(`Las salas de prueba no se crearon: ${cuerpo.motivo}`);
  return { cookie, salas: cuerpo.valor.salas };
}

// Para las pruebas que necesitan siempre lo mismo: antes de cada una, un contexto nuevo con la
// cuenta del administrador y dos salas ("Auditorio" y "Sala 2"). El resultado se lee por
// propiedades (`entorno.contexto`) porque se rearma en cada prueba.
export function usarCuentaConSalas(): {
  contexto: ReturnType<typeof crearContextoDePrueba>;
  cookie: string;
  salas: Sala[];
  // Invita a un operador con esas salas, entra con su código y devuelve la cookie de su sesión.
  cookieDeOperador: (salaIds: string[]) => Promise<string>;
  auditorio: () => string;
  sala2: () => string;
  comoAdmin: (ruta: string, cuerpo?: unknown, metodo?: string) => Request;
} {
  const entorno = {
    contexto: crearContextoDePrueba(),
    cookie: "",
    salas: [] as Sala[],
    auditorio: () => (entorno.salas[0] as Sala).id,
    sala2: () => (entorno.salas[1] as Sala).id,
    // Un pedido del administrador (con su cookie).
    comoAdmin: (ruta: string, cuerpo?: unknown, metodo = "POST") =>
      pedido(ruta, cuerpo, entorno.cookie, metodo),
    async cookieDeOperador(salaIds: string[]) {
      const invitacion = await crearOperadores(
        pedido("/api/operadores", { personas: [{ nombre: "Juli", salaIds }] }, entorno.cookie),
        entorno.contexto,
      );
      const cuerpo = validar(esquemaOperadoresConCodigo, await invitacion.json());
      if (!cuerpo.ok) throw new Error(`No se pudo invitar al operador: ${cuerpo.motivo}`);
      const entrada = await ingresarOperador(
        pedido("/api/acceso/operador", { codigo: cuerpo.valor.operadores[0]?.codigo }),
        entorno.contexto,
      );
      return cookieDe(entrada);
    },
  };
  beforeEach(async () => {
    entorno.contexto = crearContextoDePrueba();
    const { cookie, salas } = await abrirCuentaConSalas(entorno.contexto, ["Auditorio", "Sala 2"]);
    entorno.cookie = cookie;
    entorno.salas = salas;
  });
  return entorno;
}
