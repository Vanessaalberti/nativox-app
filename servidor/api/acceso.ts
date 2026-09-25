import {
  esquemaCambiarContrasena,
  esquemaConContrasena,
  esquemaCrearCuenta,
  esquemaIngresar,
  esquemaIngresarOperador,
  esquemaRecuperar,
} from "@compartido/contratos";
import {
  compararEnTiempoConstante,
  generarCodigoDeRecuperacion,
  hashearCodigo,
  hashearCodigoDeInvitacion,
  hashearContrasena,
  verificarContrasena,
} from "@servidor/modulos/cripto-acceso";
import { responderError } from "@servidor/plataforma/errores";
import { conCuerpo, leerCuerpo } from "@servidor/plataforma/pedido";
import {
  abrirSesion,
  cerrarSesion,
  comoAdministrador,
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

// El operador entra con el código que le mandó el administrador. Sin email de por medio, lo que
// frena las adivinanzas es el largo del código (60 bits) y el tope de intentos por origen.
export async function ingresarOperador(pedido: Request, contexto: ContextoApi): Promise<Response> {
  const cuerpo = await leerCuerpo(pedido, esquemaIngresarOperador);
  if (!cuerpo.ok) return responderError(400, "pedido_invalido", cuerpo.motivo);
  if (await estaBloqueado(contexto, "operador", contexto.ip)) return respuestaDeBloqueo();

  const persona = await contexto.operadores.buscarPorCodigo(
    await hashearCodigoDeInvitacion(cuerpo.valor.codigo),
  );
  if (!persona) {
    await registrarFallo(contexto, "operador", contexto.ip);
    return responderError(401, "codigo_invalido", "El código no es válido o fue revocado.");
  }

  await contexto.operadores.registrarIngreso(persona.id, contexto.ahora());
  return responderConCookie({ ok: true }, await abrirSesion(contexto, "operador", persona.id));
}

export async function salir(pedido: Request, contexto: ContextoApi): Promise<Response> {
  await cerrarSesion(pedido, contexto);
  return responderConCookie({ ok: true }, cookieVencida(contexto.segura));
}

// Verifica la contraseña del administrador con el mismo tope de intentos que el ingreso: sirve
// para las acciones que cambian el acceso (contraseña nueva, código de recuperación nuevo).
async function contrasenaDelAdministrador(
  contexto: ContextoApi,
  accion: string,
  contrasena: string,
): Promise<Response | null> {
  const administrador = await contexto.almacen.leerAdministrador();
  if (!administrador) return responderError(404, "sin_cuenta", "Todavía no hay una cuenta.");
  if (await estaBloqueado(contexto, accion, administrador.email)) return respuestaDeBloqueo();

  if (!(await verificarContrasena(contrasena, administrador.contrasenaHash))) {
    await registrarFallo(contexto, accion, administrador.email);
    return responderError(401, "contrasena_incorrecta", "La contraseña actual no es correcta.");
  }
  await contexto.almacen.borrarIntentos(`${accion}:email:${administrador.email}`);
  return null;
}

// Cambia la contraseña: se cierran las demás sesiones abiertas y se sigue con una nueva.
export function cambiarContrasena(pedido: Request, contexto: ContextoApi): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaCambiarContrasena, async ({ actual, nueva }) => {
      const rechazo = await contrasenaDelAdministrador(contexto, "contrasena", actual);
      if (rechazo) return rechazo;

      const administrador = await contexto.almacen.leerAdministrador();
      await contexto.almacen.cambiarCredenciales({
        contrasenaHash: await hashearContrasena(nueva),
        codigoRecuperacionHash: administrador?.codigoRecuperacionHash ?? "",
      });
      await contexto.almacen.borrarSesionesDe("administrador", 1);
      return responderConCookie({ ok: true }, await abrirSesion(contexto, "administrador", 1));
    }),
  );
}

// Genera un código de recuperación nuevo (el anterior deja de servir). Se muestra una sola vez.
export function nuevoCodigoDeRecuperacion(
  pedido: Request,
  contexto: ContextoApi,
): Promise<Response> {
  return comoAdministrador(pedido, contexto, () =>
    conCuerpo(pedido, esquemaConContrasena, async ({ contrasena }) => {
      const rechazo = await contrasenaDelAdministrador(contexto, "codigo", contrasena);
      if (rechazo) return rechazo;

      const administrador = await contexto.almacen.leerAdministrador();
      const codigo = generarCodigoDeRecuperacion();
      await contexto.almacen.cambiarCredenciales({
        contrasenaHash: administrador?.contrasenaHash ?? "",
        codigoRecuperacionHash: await hashearCodigo(codigo),
      });
      return Response.json({ ok: true, codigoRecuperacion: codigo });
    }),
  );
}
