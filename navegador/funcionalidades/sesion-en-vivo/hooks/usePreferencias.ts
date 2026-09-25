import { useEffect, useState } from "react";
import type { PreferenciasDeSesion } from "@compartido/contratos";
import { leerPreferenciasDeSesion } from "@navegador/modulos/cliente-instancia";

// Las preferencias de Ajustes que aplica esta computadora (reparación automática, etc.). Mientras
// no llegan, o si no se pueden leer, no se aplica ninguna.
export function usePreferencias(): PreferenciasDeSesion | null {
  const [preferencias, setPreferencias] = useState<PreferenciasDeSesion | null>(null);

  useEffect(() => {
    void leerPreferenciasDeSesion().then((respuesta) => {
      if (respuesta.ok) setPreferencias(respuesta.valor);
    });
  }, []);

  return preferencias;
}
