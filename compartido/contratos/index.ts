export { IDIOMAS, NOMBRES_DE_IDIOMA, esquemaIdioma, type Idioma } from "./idiomas";
export { validar, type Resultado } from "./validar";
export {
  esquemaAgenda,
  esquemaEstadoSala,
  ROLES_DE_SALA,
  type EstadoSala,
  type RolDeSala,
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
  contarDias,
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
export {
  esquemaCrearSalas,
  esquemaDatosDeSala,
  esquemaListaDeSalas,
  esquemaSala,
  esquemaUnaSala,
  MAXIMO_DE_SALAS_POR_PEDIDO,
  type CrearSalas,
  type DatosDeSala,
  type Sala,
} from "./api/salas";
export {
  esquemaDatosDeCharla,
  esquemaListaDeCharlas,
  esquemaUnaCharla,
  LARGO_MAXIMO_DEL_GLOSARIO,
  MINUTOS_POR_DIA,
  type Charla,
  type DatosDeCharla,
} from "./api/charlas";
export {
  esquemaCodigoNuevo,
  esquemaCrearOperadores,
  esquemaDatosDeOperador,
  esquemaListaDeOperadores,
  esquemaOperadoresConCodigo,
  esquemaUnOperador,
  MAXIMO_DE_PERSONAS_POR_PEDIDO,
  type DatosDeOperador,
  type Operador,
  type OperadorConCodigo,
} from "./api/operadores";
export {
  esquemaAudiencia,
  type Audiencia,
  type CharlaPublica,
  type SalaPublica,
} from "./api/audiencia";
export {
  ESTILO_POR_DEFECTO,
  esquemaDatosDeSalida,
  esquemaListaDeSalidas,
  esquemaTransmision,
  esquemaUnaSalida,
  type DatosDeSalida,
  type SalidaDeProduccion,
  type Transmision,
} from "./api/produccion";
export {
  AJUSTES_POR_DEFECTO,
  esquemaActualizarEvento,
  esquemaAjustes,
  esquemaCambiarContrasena,
  esquemaConContrasena,
  esquemaEliminarEvento,
  esquemaRespuestaAjustes,
  esquemaWebhook,
  type ActualizarEvento,
  type Ajustes,
} from "./api/ajustes";
export {
  esquemaAccionPendiente,
  esquemaRegistroAire,
  esquemaTranscripcion,
  type AccionPendiente,
  type EntradaDeAire,
  type Transcripcion,
} from "./api/operacion";
export { esquemaPreferenciasDeSesion, type PreferenciasDeSesion } from "./api/ajustes";
