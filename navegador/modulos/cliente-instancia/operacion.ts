import {
  esquemaAccionPendiente,
  esquemaPreferenciasDeSesion,
  esquemaRegistroAire,
  esquemaTranscripcion,
  type AccionPendiente,
  type EntradaDeAire,
  type PreferenciasDeSesion,
  type Resultado,
  type Transcripcion,
} from "@compartido/contratos";
import { llamar } from "./llamar";

// El link de un aviso: primero se mira (no gasta nada) y después se confirma (se usa una vez).
export function verAccionDeAviso(token: string): Promise<Resultado<AccionPendiente>> {
  return llamar(`/api/publico/acciones/${token}`, esquemaAccionPendiente);
}

export function confirmarAccionDeAviso(token: string): Promise<Resultado<AccionPendiente>> {
  return llamar(`/api/publico/acciones/${token}`, esquemaAccionPendiente, {
    metodo: "POST",
    cuerpo: {},
  });
}

// Lo que se transcribió de una charla.
export async function leerTranscripcion(
  charlaId: string,
): Promise<Resultado<Transcripcion["segmentos"]>> {
  const respuesta = await llamar(`/api/charlas/${charlaId}/transcripcion`, esquemaTranscripcion);
  return respuesta.ok ? { ok: true, valor: respuesta.valor.segmentos } : respuesta;
}

export async function leerRegistroDeAire(): Promise<Resultado<EntradaDeAire[]>> {
  const respuesta = await llamar("/api/salidas/registro", esquemaRegistroAire);
  return respuesta.ok ? { ok: true, valor: respuesta.valor.entradas } : respuesta;
}

// Las preferencias de los ajustes que aplica la computadora de la sala.
export function leerPreferenciasDeSesion(): Promise<Resultado<PreferenciasDeSesion>> {
  return llamar("/api/sesion/preferencias", esquemaPreferenciasDeSesion);
}
