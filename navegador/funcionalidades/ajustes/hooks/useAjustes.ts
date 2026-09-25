import { useCallback, useEffect, useState } from "react";
import type { Ajustes } from "@compartido/contratos";
import {
  guardarAjustes,
  guardarWebhook,
  leerAjustes,
  probarWebhook,
  type AjustesLeidos,
} from "@navegador/modulos/cliente-instancia";

export type CargaDeAjustes =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; datos: AjustesLeidos };

// Los ajustes del administrador. Cada cambio se guarda al instante; las acciones devuelven el
// motivo si fallan (null si salió bien).
export function useAjustes() {
  const [carga, setCarga] = useState<CargaDeAjustes>({ fase: "cargando" });

  const recargar = useCallback(async () => {
    const respuesta = await leerAjustes();
    setCarga(
      respuesta.ok
        ? { fase: "lista", datos: respuesta.valor }
        : { fase: "error", motivo: respuesta.motivo },
    );
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const guardarDatos = async (pedir: () => ReturnType<typeof guardarAjustes>) => {
    const respuesta = await pedir();
    if (!respuesta.ok) return respuesta.motivo;
    setCarga({ fase: "lista", datos: respuesta.valor });
    return null;
  };

  return {
    carga,
    recargar,
    guardar: (ajustes: Ajustes) => guardarDatos(() => guardarAjustes(ajustes)),
    guardarElWebhook: (url: string | null) => guardarDatos(() => guardarWebhook(url)),
    probarElWebhook: async () => {
      const respuesta = await probarWebhook();
      return respuesta.ok ? null : respuesta.motivo;
    },
  };
}
