import { useState } from "react";

// Lo que comparten los formularios que mandan algo al servidor: bloquear el botón mientras espera
// y mostrar el motivo si falla. La acción devuelve el motivo (null si salió bien) y `enviar` lo
// devuelve también, para que quien lo llama siga (cerrar, navegar) solo si salió bien.
export function useEnvio() {
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (accion: () => Promise<string | null>): Promise<string | null> => {
    setEnviando(true);
    setError(null);
    const motivo = await accion();
    setEnviando(false);
    setError(motivo);
    return motivo;
  };

  return { error, enviando, enviar };
}
