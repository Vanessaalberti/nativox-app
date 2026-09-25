import { useEffect, useState } from "react";
import { borrarGuardados, medirGuardados } from "@navegador/modulos/modelos-compartidos";

const megas = (bytes: number) => `${String(Math.round(bytes / 1e6))} MB`;

// Libera lo que se descargó para trabajar sin internet (Whisper, Bergamot, ONNX Runtime). La
// próxima sesión los vuelve a bajar.
export function BorrarModelos({ deshabilitado }: { deshabilitado: boolean }) {
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    void medirGuardados().then(setOcupado);
  }, []);

  const borrar = async () => {
    const confirmado = window.confirm(
      "Se borran los modelos guardados en este navegador. La próxima sesión los vuelve a descargar (~0,8 GB). ¿Seguimos?",
    );
    if (!confirmado) return;
    const resultado = await borrarGuardados();
    setMensaje(
      resultado.ok
        ? `Listo: se liberaron ${megas(resultado.valor.bytesLiberados)}. Recargá la página para soltar también lo que quedó en memoria.`
        : resultado.motivo,
    );
    setOcupado(await medirGuardados());
  };

  return (
    <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-ink/60">
      <button
        type="button"
        disabled={deshabilitado || ocupado === 0}
        onClick={() => void borrar()}
        className="underline decoration-ink/30 underline-offset-4 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        Borrar los modelos guardados{ocupado !== null ? ` (${megas(ocupado)})` : ""}
      </button>
      {mensaje && <span role="status">{mensaje}</span>}
    </div>
  );
}
