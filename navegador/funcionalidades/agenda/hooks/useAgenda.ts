import { useCallback, useEffect, useState } from "react";
import type { Charla, DatosDeCharla, Sala } from "@compartido/contratos";
import {
  actualizarCharla,
  borrarCharla,
  crearCharla,
  leerEvento,
  leerSala,
  listarCharlas,
} from "@navegador/modulos/cliente-instancia";

export type CargaDeAgenda =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | {
      fase: "lista";
      sala: Sala;
      charlas: Charla[];
      // El primer día del evento (si se definió): la semana con la que abre el calendario.
      inicioDelEvento: string | null;
    };

// La agenda de una sala. Cada acción devuelve el motivo si falla (null si salió bien) y, si salió
// bien, vuelve a pedir las charlas.
export function useAgenda(salaId: string) {
  const [carga, setCarga] = useState<CargaDeAgenda>({ fase: "cargando" });

  const cargar = useCallback(async () => {
    const [sala, charlas, evento] = await Promise.all([
      leerSala(salaId),
      listarCharlas(salaId),
      leerEvento(),
    ]);
    if (!sala.ok) {
      setCarga({ fase: "error", motivo: sala.motivo });
    } else if (!charlas.ok) {
      setCarga({ fase: "error", motivo: charlas.motivo });
    } else {
      setCarga({
        fase: "lista",
        sala: sala.valor,
        charlas: charlas.valor,
        inicioDelEvento: evento.ok ? evento.valor.evento.fechaInicio : null,
      });
    }
  }, [salaId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const conRecarga = async (
    accion: () => Promise<{ ok: true } | { ok: false; motivo: string }>,
  ) => {
    const respuesta = await accion();
    if (!respuesta.ok) return respuesta.motivo;
    await cargar();
    return null;
  };

  return {
    carga,
    recargar: cargar,
    crear: (datos: DatosDeCharla) => conRecarga(() => crearCharla(salaId, datos)),
    editar: (id: string, datos: DatosDeCharla) => conRecarga(() => actualizarCharla(id, datos)),
    eliminar: (id: string) => conRecarga(() => borrarCharla(id)),
  };
}
