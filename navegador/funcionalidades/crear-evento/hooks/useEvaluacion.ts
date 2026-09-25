import { useCallback, useState } from "react";
import {
  evaluarEquipo,
  type AvanceEvaluacion,
  type Evaluacion,
} from "@navegador/modulos/evaluar-equipo";

export type EstadoEvaluacion =
  | { fase: "inactiva" }
  | { fase: "evaluando"; avance: AvanceEvaluacion }
  | { fase: "lista"; evaluacion: Evaluacion }
  | { fase: "error"; motivo: string };

// "Evaluar esta computadora": revisa la placa y mide su potencia (unos segundos, sin descargar nada).
export function useEvaluacion() {
  const [estado, setEstado] = useState<EstadoEvaluacion>({ fase: "inactiva" });

  const evaluar = useCallback(async () => {
    setEstado({ fase: "evaluando", avance: { etapa: "detectando" } });
    const resultado = await evaluarEquipo((avance) => setEstado({ fase: "evaluando", avance }));
    setEstado(
      resultado.ok
        ? { fase: "lista", evaluacion: resultado.valor }
        : { fase: "error", motivo: resultado.motivo },
    );
  }, []);

  return { estado, evaluar };
}
