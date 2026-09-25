import { generarToken, hashearToken } from "@servidor/modulos/cripto-acceso";
import type { AlmacenAcceso, Rol, SesionGuardada } from "@servidor/plataforma/almacen-acceso";
import type { AlmacenAgenda } from "@servidor/plataforma/almacen-agenda";
import { responderError } from "@servidor/plataforma/errores";

// Lo que cada pedido necesita saber de su entorno: dónde guardar, qué hora es y quién pregunta.
export interface ContextoApi {
  almacen: AlmacenAcceso;
  agenda: AlmacenAgenda;
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
