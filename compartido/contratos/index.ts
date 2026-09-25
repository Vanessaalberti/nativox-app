export { IDIOMAS, esquemaIdioma, type Idioma } from "./idiomas";
export { validar, type Resultado } from "./validar";
export {
  esquemaAgenda,
  esquemaComando,
  esquemaLinea,
  esquemaMensajeSala,
  esquemaSenal,
  type AvisoAgenda,
  type Comando,
  type Linea,
  type MensajeSala,
  type Senal,
} from "./socket-sala";
export {
  esquemaEstiloSalida,
  esquemaSalida,
  type EstiloSalida,
  type Salida,
} from "./socket-produccion";
export { esquemaRespuestaError, type RespuestaError } from "./api/errores";
export {
  esquemaCrearCuenta,
  esquemaIngresar,
  esquemaIngresarOperador,
  esquemaRecuperar,
  esquemaRespuestaConCodigo,
  esquemaRespuestaSimple,
  LARGO_MAXIMO_DE_CONTRASENA,
  LARGO_MINIMO_DE_CONTRASENA,
  type CrearCuenta,
  type Ingresar,
  type Recuperar,
} from "./api/acceso";
export {
  esquemaDatosEvento,
  esquemaEstadoDeLaInstancia,
  esquemaEventoCompleto,
  esquemaTipoDeEvento,
  LARGO_MAXIMO_DE_LOGO,
  LIMITES_DE_ESTIMACION,
  TIPOS_DE_EVENTO,
  type DatosEvento,
  type EstadoDeLaInstancia,
  type EventoCompleto,
  type TipoDeEvento,
} from "./api/evento";
