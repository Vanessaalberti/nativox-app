import { useCallback, useEffect, useState } from "react";
import type { Audiencia } from "@compartido/contratos";
import { leerAudiencia } from "@navegador/modulos/cliente-instancia";

export type CargaDeAudiencia =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; audiencia: Audiencia };

const CADA_CUANTO_SE_ACTUALIZA_MS = 15_000;

// El evento, sus salas y sus charlas: lo que ve cualquiera. Se vuelve a pedir cada 15 segundos
// para que el estado "en vivo" de las salas siga al día.
export function useAudiencia(token: string | null) {
  const [carga, setCarga] = useState<CargaDeAudiencia>({ fase: "cargando" });

  const cargar = useCallback(async () => {
    const respuesta = await leerAudiencia(token);
    setCarga((anterior) => {
      if (respuesta.ok) return { fase: "lista", audiencia: respuesta.valor };
      // Si ya se veía algo, un pedido que falla no lo borra.
      return anterior.fase === "lista" ? anterior : { fase: "error", motivo: respuesta.motivo };
    });
  }, [token]);

  useEffect(() => {
    void cargar();
    const intervalo = setInterval(() => void cargar(), CADA_CUANTO_SE_ACTUALIZA_MS);
    return () => clearInterval(intervalo);
  }, [cargar]);

  return { carga, recargar: cargar };
}
