import { useCallback, useEffect, useState } from "react";
import type { DatosDeSala, Sala } from "@compartido/contratos";
import {
  actualizarSala,
  borrarSala,
  crearSalas,
  listarSalas,
} from "@navegador/modulos/cliente-instancia";

export type CargaDeSalas =
  { fase: "cargando" } | { fase: "error"; motivo: string } | { fase: "lista"; salas: Sala[] };

// Las salas del evento y lo que se puede hacer con ellas. Cada acción devuelve el motivo si falla
// (null si salió bien) y, si salió bien, vuelve a pedir la lista.
export function useSalas() {
  const [carga, setCarga] = useState<CargaDeSalas>({ fase: "cargando" });

  const recargar = useCallback(async () => {
    const respuesta = await listarSalas();
    setCarga(
      respuesta.ok
        ? { fase: "lista", salas: respuesta.valor }
        : { fase: "error", motivo: respuesta.motivo },
    );
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const conRecarga = useCallback(
    async (accion: () => Promise<{ ok: true } | { ok: false; motivo: string }>) => {
      const respuesta = await accion();
      if (!respuesta.ok) return respuesta.motivo;
      await recargar();
      return null;
    },
    [recargar],
  );

  return {
    carga,
    recargar,
    crear: (salas: DatosDeSala[]) => conRecarga(() => crearSalas(salas)),
    editar: (id: string, datos: DatosDeSala) => conRecarga(() => actualizarSala(id, datos)),
    eliminar: (id: string) => conRecarga(() => borrarSala(id)),
  };
}
