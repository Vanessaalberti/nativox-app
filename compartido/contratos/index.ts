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
