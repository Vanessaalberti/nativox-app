import { useState, type ReactNode } from "react";
import { Aviso } from "./Aviso";
import { Boton } from "./Boton";

// El pie de una ventana de edición: "Eliminar" y, antes de borrar de verdad, una confirmación.
export function ZonaDeEliminar({
  etiqueta,
  aviso,
  enviando,
  alEliminar,
}: {
  etiqueta: string;
  aviso: ReactNode;
  enviando: boolean;
  alEliminar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="mt-8 border-t border-linea-fuerte pt-5">
      {confirmando ? (
        <div className="flex flex-col gap-3">
          <Aviso>{aviso}</Aviso>
          <div className="flex gap-3">
            <Boton variante="secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </Boton>
            <Boton disabled={enviando} onClick={alEliminar}>
              Sí, eliminar
            </Boton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="font-mono text-xs tracking-widest text-[#b8241f] uppercase underline"
        >
          {etiqueta}
        </button>
      )}
    </div>
  );
}
