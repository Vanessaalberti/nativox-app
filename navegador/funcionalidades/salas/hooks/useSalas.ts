import { useCallback, useEffect, useState } from "react";
import type { DatosDeSala, Sala } from "@compartido/contratos";
import {
  actualizarSala,
  borrarSala,
  crearSalas,
  listarOperadores,
  listarSalas,
} from "@navegador/modulos/cliente-instancia";
import { useConRecarga } from "@navegador/interfaz/sistema-diseno";

export type CargaDeSalas =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; salas: Sala[]; operadoresPorSala: Record<string, number> };

// Las salas del evento y lo que se puede hacer con ellas. Cada acción devuelve el motivo si falla
// (null si salió bien) y, si salió bien, vuelve a pedir la lista.
export function useSalas() {
  const [carga, setCarga] = useState<CargaDeSalas>({ fase: "cargando" });

  const recargar = useCallback(async () => {
    const [respuesta, equipo] = await Promise.all([listarSalas(), listarOperadores()]);
    if (!respuesta.ok) {
      setCarga({ fase: "error", motivo: respuesta.motivo });
      return;
    }
    // Sin equipo (o si no se pudo leer) las tarjetas simplemente no cuentan operadores.
    const operadoresPorSala: Record<string, number> = {};
    for (const operador of equipo.ok ? equipo.valor : []) {
      for (const salaId of operador.salaIds) {
        operadoresPorSala[salaId] = (operadoresPorSala[salaId] ?? 0) + 1;
      }
    }
    setCarga({ fase: "lista", salas: respuesta.valor, operadoresPorSala });
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const conRecarga = useConRecarga(recargar);

  return {
    carga,
    recargar,
    crear: (salas: DatosDeSala[]) => conRecarga(() => crearSalas(salas)),
    editar: (id: string, datos: DatosDeSala) => conRecarga(() => actualizarSala(id, datos)),
    eliminar: (id: string) => conRecarga(() => borrarSala(id)),
  };
}
