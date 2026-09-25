import { generarToken, hashearToken } from "@servidor/modulos/cripto-acceso";
import type { AlmacenAcceso, Rol, SesionGuardada } from "@servidor/plataforma/almacen-acceso";
import type { AlmacenAgenda } from "@servidor/plataforma/almacen-agenda";
import type { AlmacenAjustes } from "@servidor/plataforma/almacen-ajustes";
import type { AlmacenOperacion } from "@servidor/plataforma/almacen-operacion";
import type { AlmacenOperadores } from "@servidor/plataforma/almacen-operadores";
import type { AlmacenProduccion } from "@servidor/plataforma/almacen-produccion";
import type { Avisos } from "@servidor/plataforma/avisos";
import type { TiempoReal } from "@servidor/plataforma/tiempo-real";
import type { Transcriptor } from "@servidor/plataforma/transcriptor";
import { responderError } from "@servidor/plataforma/errores";

// Lo que cada pedido necesita saber de su entorno: dónde guardar, qué hora es y quién pregunta.
export interface ContextoApi {
  almacen: AlmacenAcceso;
  agenda: AlmacenAgenda;
  operadores: AlmacenOperadores;
  produccion: AlmacenProduccion;
  operacion: AlmacenOperacion;
  ajustes: AlmacenAjustes;
  avisos: Avisos;
  tiempoReal: TiempoReal;
  transcriptor: Transcriptor;
  ahora: () => number;
  // Para frenar intentos en cadena por origen (CF-Connecting-IP en Cloudflare).
  ip: string;
  // Solo por HTTPS la cookie lleva `Secure` (en localhost, con http, el navegador la rechazaría).
  segura: boolean;
}

const NOMBRE_DE_LA_COOKIE = "nativox_sesion";
const DURACION_DE_LA_SESION_MS = 30 * 24 * 60 * 60 * 1000;

function leerToken(pedido: Request): string | null {
  for (const parte of (pedido.headers.get("Cookie") ?? "").split(";")) {
    const [nombre, ...valor] = parte.trim().split("=");
    if (nombre === NOMBRE_DE_LA_COOKIE) return valor.join("=") || null;
  }
  return null;
}

function atributos(segura: boolean): string {
  return `Path=/; HttpOnly; SameSite=Strict${segura ? "; Secure" : ""}`;
}

export async function sesionDe(
  pedido: Request,
  contexto: ContextoApi,
): Promise<SesionGuardada | null> {
  const token = leerToken(pedido);
  if (!token) return null;
  return contexto.almacen.leerSesion(await hashearToken(token), contexto.ahora());
}

// Crea la sesión y devuelve el encabezado Set-Cookie: en el navegador queda el token y en la base
// solo su hash, así que una copia de la base no sirve para entrar.
export async function abrirSesion(
  contexto: ContextoApi,
  rol: Rol,
  cuentaId: number,
): Promise<string> {
  const token = generarToken();
  const ahora = contexto.ahora();
  await contexto.almacen.guardarSesion(
    await hashearToken(token),
    { rol, cuentaId },
    ahora,
    ahora + DURACION_DE_LA_SESION_MS,
  );
  const segundos = String(DURACION_DE_LA_SESION_MS / 1000);
  return `${NOMBRE_DE_LA_COOKIE}=${token}; ${atributos(contexto.segura)}; Max-Age=${segundos}`;
}

export function cookieVencida(segura: boolean): string {
  return `${NOMBRE_DE_LA_COOKIE}=; ${atributos(segura)}; Max-Age=0`;
}

export async function cerrarSesion(pedido: Request, contexto: ContextoApi): Promise<void> {
  const token = leerToken(pedido);
  if (token) await contexto.almacen.borrarSesion(await hashearToken(token));
}

export function responderConCookie(cuerpo: unknown, cookie: string, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
  });
}

// null si quien pregunta es el administrador; si no, la respuesta de error lista para devolver.
export async function exigirAdministrador(
  pedido: Request,
  contexto: ContextoApi,
): Promise<Response | null> {
  const sesion = await sesionDe(pedido, contexto);
  if (!sesion) return responderError(401, "sin_sesion", "Ingresá para continuar.");
  if (sesion.rol !== "administrador") {
    return responderError(403, "sin_permiso", "Esta acción es solo para el administrador.");
  }
  return null;
}

// Corre la acción solo si quien pregunta es el administrador; si no, responde el error.
export async function comoAdministrador(
  pedido: Request,
  contexto: ContextoApi,
  accion: () => Promise<Response>,
): Promise<Response> {
  return (await exigirAdministrador(pedido, contexto)) ?? accion();
}

// Corre la acción con la sesión de quien pregunta, sea administrador u operador.
export async function comoPersona(
  pedido: Request,
  contexto: ContextoApi,
  accion: (sesion: SesionGuardada) => Promise<Response>,
): Promise<Response> {
  const sesion = await sesionDe(pedido, contexto);
  if (!sesion) return responderError(401, "sin_sesion", "Ingresá para continuar.");
  return accion(sesion);
}

// El administrador ve todas las salas; un operador, solo las que le asignaron.
export async function puedeVerSala(
  contexto: ContextoApi,
  sesion: SesionGuardada,
  salaId: string,
): Promise<boolean> {
  if (sesion.rol === "administrador") return true;
  return (await contexto.operadores.salasDe(sesion.cuentaId)).includes(salaId);
}
