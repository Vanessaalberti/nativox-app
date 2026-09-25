import type { Resultado } from "@compartido/contratos";
import { detectarEquipo, type Equipo } from "./placa";
import { estimarPasada, recomendar, type Medidas, type Recomendacion } from "./recomendacion";
import { medirRendimiento } from "./rendimiento";

export interface Evaluacion {
  equipo: Equipo;
  // null si el equipo no puede correr Whisper (no hubo nada que medir).
  medidas: Medidas | null;
  recomendacion: Recomendacion;
}

export type AvanceEvaluacion = { etapa: "detectando" } | { etapa: "midiendo" };

// "Evaluar mi computadora" revisa el equipo (placa, memoria) y mide la potencia de la placa. No
// baja modelos ni usa el micrófono: tarda unos segundos y no gasta nada.
export async function evaluarEquipo(
  alAvanzar: (avance: AvanceEvaluacion) => void,
): Promise<Resultado<Evaluacion>> {
  alAvanzar({ etapa: "detectando" });
  const equipo = await detectarEquipo();
  if (!equipo.webgpu) {
    return { ok: true, valor: { equipo, medidas: null, recomendacion: recomendar(equipo, null) } };
  }

  alAvanzar({ etapa: "midiendo" });
  const rendimiento = await medirRendimiento();
  if (!rendimiento.ok) return rendimiento;
  const medidas: Medidas = {
    gflops: rendimiento.valor.gflops,
    pasadaEstimadaMs: estimarPasada(rendimiento.valor.gflops),
  };
  return { ok: true, valor: { equipo, medidas, recomendacion: recomendar(equipo, medidas) } };
}
