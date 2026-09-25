import { useCallback, useEffect, useState } from "react";
import type { EstadoDeLaInstancia } from "@compartido/contratos";
import { leerEstado } from "@navegador/modulos/cliente-instancia";

export type CargaDelEstado =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; estado: EstadoDeLaInstancia };

// Qué falta hacer en la instancia y quién es la persona: lo primero que se pregunta al abrir la app.
export function useEstadoDeLaInstancia() {
  const [carga, setCarga] = useState<CargaDelEstado>({ fase: "cargando" });

  const cargar = useCallback(async () => {
    setCarga({ fase: "cargando" });
    const respuesta = await leerEstado();
    setCarga(
      respuesta.ok
        ? { fase: "lista", estado: respuesta.valor }
        : { fase: "error", motivo: respuesta.motivo },
    );
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { carga, recargar: cargar };
}
