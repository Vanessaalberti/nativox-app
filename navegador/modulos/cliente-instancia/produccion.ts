import {
  esquemaAudiencia,
  esquemaEnlaceDeAudiencia,
  esquemaListaDeSalidas,
  esquemaRespuestaSimple,
  esquemaTransmision,
  esquemaUnaSalida,
  type Audiencia,
  type DatosDeSalida,
  type EstiloSalida,
  type Resultado,
  type SalidaDeProduccion,
  type Transmision,
} from "@compartido/contratos";
import { llamar } from "./llamar";

// Lo que ve la audiencia: no necesita sesión, pero sí el link que genera el administrador (el
// administrador con su sesión lo ve sin link).
export function leerAudiencia(token: string | null = null): Promise<Resultado<Audiencia>> {
  const consulta = token === null ? "" : `?t=${encodeURIComponent(token)}`;
  return llamar(`/api/audiencia${consulta}`, esquemaAudiencia);
}

// El link para la audiencia: el vigente, o uno nuevo (el anterior deja de servir). Devuelven el token.
export async function leerEnlaceDeAudiencia(renovar = false): Promise<Resultado<string>> {
  const respuesta = await llamar("/api/audiencia/enlace", esquemaEnlaceDeAudiencia, {
    metodo: renovar ? "POST" : "GET",
  });
  return respuesta.ok ? { ok: true, valor: respuesta.valor.token } : respuesta;
}

export function leerTransmisionDeSala(salaId: string): Promise<Resultado<Transmision>> {
  return llamar(`/api/publico/salas/${salaId}/transmision`, esquemaTransmision);
}

export function leerTransmisionDeSalida(numero: number): Promise<Resultado<Transmision>> {
  return llamar(`/api/publico/salidas/${String(numero)}`, esquemaTransmision);
}

// Lo del administrador (y el estilo de una sala, también del operador de esa sala).
export async function listarSalidas(): Promise<Resultado<SalidaDeProduccion[]>> {
  const respuesta = await llamar("/api/salidas", esquemaListaDeSalidas);
  return respuesta.ok ? { ok: true, valor: respuesta.valor.salidas } : respuesta;
}

export async function crearSalida(nombre: string): Promise<Resultado<SalidaDeProduccion>> {
  const respuesta = await llamar("/api/salidas", esquemaUnaSalida, {
    metodo: "POST",
    cuerpo: { nombre },
  });
  return respuesta.ok ? { ok: true, valor: respuesta.valor.salida } : respuesta;
}

export async function actualizarSalida(
  numero: number,
  datos: DatosDeSalida,
): Promise<Resultado<SalidaDeProduccion>> {
  const respuesta = await llamar(`/api/salidas/${String(numero)}`, esquemaUnaSalida, {
    metodo: "PUT",
    cuerpo: datos,
  });
  return respuesta.ok ? { ok: true, valor: respuesta.valor.salida } : respuesta;
}

export async function borrarSalida(numero: number): Promise<Resultado<null>> {
  const respuesta = await llamar(`/api/salidas/${String(numero)}`, esquemaRespuestaSimple, {
    metodo: "DELETE",
  });
  return respuesta.ok ? { ok: true, valor: null } : respuesta;
}

export async function guardarEstiloDeSala(
  salaId: string,
  estilo: EstiloSalida,
): Promise<Resultado<null>> {
  const respuesta = await llamar(`/api/salas/${salaId}/estilo`, esquemaRespuestaSimple, {
    metodo: "PUT",
    cuerpo: estilo,
  });
  return respuesta.ok ? { ok: true, valor: null } : respuesta;
}
