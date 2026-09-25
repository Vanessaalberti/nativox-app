import { useState } from "react";

// Lo que comparten los formularios que mandan algo al servidor: bloquear el botón mientras espera
// y mostrar el motivo si falla. La acción devuelve el motivo (null si salió bien); si salió bien se
// llama a `alTerminar` (cerrar la ventana, seguir a otra pantalla). `enviar` devuelve el motivo.
export function useEnvio(alTerminar?: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (accion: () => Promise<string | null>): Promise<string | null> => {
    setEnviando(true);
    setError(null);
    const motivo = await accion();
    setEnviando(false);
    setError(motivo);
    if (motivo === null) alTerminar?.();
    return motivo;
  };

  return { error, enviando, enviar };
}
