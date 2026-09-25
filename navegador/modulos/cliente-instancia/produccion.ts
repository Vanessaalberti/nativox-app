import {
  esquemaAudiencia,
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

// Lo público: no necesita sesión (lo cargan la audiencia y las páginas de vMix/OBS).
export function leerAudiencia(): Promise<Resultado<Audiencia>> {
  return llamar("/api/audiencia", esquemaAudiencia);
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
