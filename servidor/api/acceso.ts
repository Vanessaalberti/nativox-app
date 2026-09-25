import {
  esquemaCrearCuenta,
  esquemaIngresar,
  esquemaIngresarOperador,
  esquemaRecuperar,
} from "@compartido/contratos";
import {
  compararEnTiempoConstante,
  generarCodigoDeRecuperacion,
  hashearCodigo,
  hashearContrasena,
  verificarContrasena,
} from "@servidor/modulos/cripto-acceso";
import { responderError } from "@servidor/plataforma/errores";
import { leerCuerpo } from "@servidor/plataforma/pedido";
import {
  abrirSesion,
  cerrarSesion,
  cookieVencida,
  responderConCookie,
  type ContextoApi,
} from "./sesion";

const VENTANA_DE_INTENTOS_MS = 15 * 60 * 1000;
const INTENTOS_POR_EMAIL = 8;
const INTENTOS_POR_IP = 30;

// Para no delatar por el tiempo de respuesta si el email existe: si no hay administrador (o el
// email no es el suyo) se verifica igual contra un hash cualquiera.
const HASH_DE_RELLENO = `pbkdf2-sha256$100000$${"00".repeat(16)}$${"00".repeat(32)}`;

const respuestaDeBloqueo = () =>
  responderError(
    429,
    "demasiados_intentos",
    "Demasiados intentos. Esperá unos minutos y probá de nuevo.",
  );

const credencialesInvalidas = () =>
  responderError(401, "credenciales_invalidas", "El email o la contraseña no son correctos.");

// Cuenta los intentos fallidos recientes por email y por origen: pasado el tope, se frena.
async function estaBloqueado(
  contexto: ContextoApi,
  accion: string,
  email: string,
): Promise<boolean> {
  const desde = contexto.ahora() - VENTANA_DE_INTENTOS_MS;
  const [porEmail, porIp] = await Promise.all([
    contexto.almacen.contarIntentos(`${accion}:email:${email}`, desde),
    contexto.almacen.contarIntentos(`${accion}:ip:${contexto.ip}`, desde),
  ]);
  return porEmail >= INTENTOS_POR_EMAIL || porIp >= INTENTOS_POR_IP;
}

async function registrarFallo(contexto: ContextoApi, accion: string, email: string): Promise<void> {
  const ahora = contexto.ahora();
  await Promise.all([
    contexto.almacen.registrarIntento(`${accion}:email:${email}`, ahora),
    contexto.almacen.registrarIntento(`${accion}:ip:${contexto.ip}`, ahora),
  ]);
}

// Crea la cuenta del administrador: solo la primera persona que llega, y solo una vez.
export async function crearCuenta(pedido: Request, contexto: ContextoApi): Promise<Response> {
  const cuerpo = await leerCuerpo(pedido, esquemaCrearCuenta);
  if (!cuerpo.ok) return responderError(400, "pedido_invalido", cuerpo.motivo);

  const codigo = generarCodigoDeRecuperacion();
  const creada = await contexto.almacen.crearAdministrador(
    {
      email: cuerpo.valor.email,
      contrasenaHash: await hashearContrasena(cuerpo.valor.contrasena),
      codigoRecuperacionHash: await hashearCodigo(codigo),
    },
    contexto.ahora(),
  );
  if (!creada) {
    return responderError(409, "cuenta_existente", "Esta instancia ya tiene un administrador.");
  }
  const cookie = await abrirSesion(contexto, "administrador", 1);
  return responderConCookie({ ok: true, codigoRecuperacion: codigo }, cookie, 201);
}

export async function ingresar(pedido: Request, contexto: ContextoApi): Promise<Response> {
  const cuerpo = await leerCuerpo(pedido, esquemaIngresar);
  if (!cuerpo.ok) return responderError(400, "pedido_invalido", cuerpo.motivo);
  const { email, contrasena } = cuerpo.valor;
  if (await estaBloqueado(contexto, "ingreso", email)) return respuestaDeBloqueo();

  const administrador = await contexto.almacen.leerAdministrador();
  const contrasenaCorrecta = await verificarContrasena(
    contrasena,
    administrador?.contrasenaHash ?? HASH_DE_RELLENO,
  );
  if (!administrador || administrador.email !== email || !contrasenaCorrecta) {
    await registrarFallo(contexto, "ingreso", email);
    return credencialesInvalidas();
  }

  await contexto.almacen.borrarIntentos(`ingreso:email:${email}`);
  return responderConCookie({ ok: true }, await abrirSesion(contexto, "administrador", 1));
}

// Olvidó la contraseña: el código de recuperación (que se mostró una sola vez) la reemplaza. El
// código usado deja de servir y se entrega uno nuevo; las sesiones abiertas se cierran.
export async function recuperar(pedido: Request, contexto: ContextoApi): Promise<Response> {
  const cuerpo = await leerCuerpo(pedido, esquemaRecuperar);
  if (!cuerpo.ok) return responderError(400, "pedido_invalido", cuerpo.motivo);
  const { email, codigo, contrasenaNueva } = cuerpo.valor;
  if (await estaBloqueado(contexto, "recuperar", email)) return respuestaDeBloqueo();

  const administrador = await contexto.almacen.leerAdministrador();
  const hashDelCodigo = await hashearCodigo(codigo);
  const codigoCorrecto = compararEnTiempoConstante(
    hashDelCodigo,
    administrador?.codigoRecuperacionHash ?? "",
  );
  if (!administrador || administrador.email !== email || !codigoCorrecto) {
    await registrarFallo(contexto, "recuperar", email);
    return responderError(
      401,
      "codigo_invalido",
      "El email o el código de recuperación no son correctos.",
    );
  }

  const codigoNuevo = generarCodigoDeRecuperacion();
  await contexto.almacen.cambiarCredenciales({
    contrasenaHash: await hashearContrasena(contrasenaNueva),
    codigoRecuperacionHash: await hashearCodigo(codigoNuevo),
  });
  await contexto.almacen.borrarSesionesDe("administrador", 1);
  await contexto.almacen.borrarIntentos(`recuperar:email:${email}`);
  const cookie = await abrirSesion(contexto, "administrador", 1);
  return responderConCookie({ ok: true, codigoRecuperacion: codigoNuevo }, cookie);
}

// Los códigos de invitación de operador se crean desde el panel de administrador (migración 0002,
// todavía no existe): hasta entonces no hay ninguno que pueda ser válido.
export async function ingresarOperador(pedido: Request, contexto: ContextoApi): Promise<Response> {
  const cuerpo = await leerCuerpo(pedido, esquemaIngresarOperador);
  if (!cuerpo.ok) return responderError(400, "pedido_invalido", cuerpo.motivo);
  if (await estaBloqueado(contexto, "operador", "codigo")) return respuestaDeBloqueo();

  await registrarFallo(contexto, "operador", "codigo");
  return responderError(401, "codigo_invalido", "El código no es válido o fue revocado.");
}

export async function salir(pedido: Request, contexto: ContextoApi): Promise<Response> {
  await cerrarSesion(pedido, contexto);
  return responderConCookie({ ok: true }, cookieVencida(contexto.segura));
}
