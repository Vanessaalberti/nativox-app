import * as v from "valibot";

export const LARGO_MINIMO_DE_CONTRASENA = 12;
export const LARGO_MAXIMO_DE_CONTRASENA = 200;

const esquemaEmail = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.maxLength(254),
  v.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Ingresá un email válido."),
);

const esquemaContrasenaNueva = v.pipe(
  v.string(),
  v.minLength(
    LARGO_MINIMO_DE_CONTRASENA,
    `La contraseña tiene que tener al menos ${String(LARGO_MINIMO_DE_CONTRASENA)} caracteres.`,
  ),
  v.maxLength(LARGO_MAXIMO_DE_CONTRASENA, "La contraseña es demasiado larga."),
);

// Se pide sin restricciones de largo: una contraseña vieja o errónea es "credenciales inválidas",
// no un error de formato que delate cómo se validan.
const esquemaContrasenaIngresada = v.pipe(v.string(), v.maxLength(LARGO_MAXIMO_DE_CONTRASENA));

export const esquemaCrearCuenta = v.object({
  email: esquemaEmail,
  contrasena: esquemaContrasenaNueva,
});

export const esquemaIngresar = v.object({
  email: esquemaEmail,
  contrasena: esquemaContrasenaIngresada,
});

export const esquemaRecuperar = v.object({
  email: esquemaEmail,
  codigo: v.pipe(v.string(), v.maxLength(40)),
  contrasenaNueva: esquemaContrasenaNueva,
});

export const esquemaIngresarOperador = v.object({
  codigo: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40)),
});

// Al crear la cuenta o recuperarla, el código de recuperación viaja una sola vez.
export const esquemaRespuestaConCodigo = v.object({
  ok: v.literal(true),
  codigoRecuperacion: v.string(),
});

export const esquemaRespuestaSimple = v.object({ ok: v.literal(true) });

export type CrearCuenta = v.InferOutput<typeof esquemaCrearCuenta>;
export type Ingresar = v.InferOutput<typeof esquemaIngresar>;
export type Recuperar = v.InferOutput<typeof esquemaRecuperar>;
