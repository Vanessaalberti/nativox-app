import { useCallback, useEffect, useState } from "react";
import type { DatosDeSalida, Sala, SalidaDeProduccion } from "@compartido/contratos";
import {
  actualizarSalida,
  borrarSalida,
  crearSalida,
  listarSalas,
  listarSalidas,
} from "@navegador/modulos/cliente-instancia";
import { useConRecarga } from "@navegador/interfaz/sistema-diseno";

export type CargaDeProduccion =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; salidas: SalidaDeProduccion[]; salas: Sala[] };

// Las salidas de producción y las salas que se les pueden poner al aire. Cada acción devuelve el
// motivo si falla (null si salió bien) y, si salió bien, vuelve a pedir todo.
export function useProduccion() {
  const [carga, setCarga] = useState<CargaDeProduccion>({ fase: "cargando" });

  const recargar = useCallback(async () => {
    const [salidas, salas] = await Promise.all([listarSalidas(), listarSalas()]);
    if (!salidas.ok) setCarga({ fase: "error", motivo: salidas.motivo });
    else if (!salas.ok) setCarga({ fase: "error", motivo: salas.motivo });
    else setCarga({ fase: "lista", salidas: salidas.valor, salas: salas.valor });
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const conRecarga = useConRecarga(recargar);

  return {
    carga,
    recargar,
    crear: (nombre: string) => conRecarga(() => crearSalida(nombre)),
    actualizar: (numero: number, datos: DatosDeSalida) =>
      conRecarga(() => actualizarSalida(numero, datos)),
    eliminar: (numero: number) => conRecarga(() => borrarSalida(numero)),
  };
}
