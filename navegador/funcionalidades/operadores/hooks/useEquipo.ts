import { useCallback, useEffect, useState } from "react";
import type { DatosDeOperador, Operador, OperadorConCodigo, Sala } from "@compartido/contratos";
import {
  actualizarOperador,
  borrarOperador,
  invitarOperadores,
  listarOperadores,
  listarSalas,
  nuevoCodigoDeOperador,
} from "@navegador/modulos/cliente-instancia";
import { useConRecarga } from "@navegador/interfaz/sistema-diseno";

export type CargaDelEquipo =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; operadores: Operador[]; salas: Sala[] };

// El equipo del evento (las personas y las salas que se les pueden asignar). Las acciones que
// cambian algo devuelven el motivo si fallan (null si salió bien) y, si salieron bien, vuelven a
// pedir la lista. Invitar y pedir un código nuevo devuelven además los códigos, que no se repiten.
export function useEquipo() {
  const [carga, setCarga] = useState<CargaDelEquipo>({ fase: "cargando" });

  const recargar = useCallback(async () => {
    const [operadores, salas] = await Promise.all([listarOperadores(), listarSalas()]);
    if (!operadores.ok) {
      setCarga({ fase: "error", motivo: operadores.motivo });
    } else if (!salas.ok) {
      setCarga({ fase: "error", motivo: salas.motivo });
    } else {
      setCarga({ fase: "lista", operadores: operadores.valor, salas: salas.valor });
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const conRecarga = useConRecarga(recargar);

  return {
    carga,
    recargar,
    editar: (id: number, datos: DatosDeOperador) => conRecarga(() => actualizarOperador(id, datos)),
    eliminar: (id: number) => conRecarga(() => borrarOperador(id)),
    async invitar(
      personas: DatosDeOperador[],
    ): Promise<{ motivo: string } | { creados: OperadorConCodigo[] }> {
      const respuesta = await invitarOperadores(personas);
      if (!respuesta.ok) return { motivo: respuesta.motivo };
      await recargar();
      return { creados: respuesta.valor };
    },
    async pedirCodigo(id: number): Promise<{ motivo: string } | { codigo: string }> {
      const respuesta = await nuevoCodigoDeOperador(id);
      if (!respuesta.ok) return { motivo: respuesta.motivo };
      await recargar();
      return { codigo: respuesta.valor };
    },
  };
}
