import { Modal, PieDeModal, useEnvio } from "@navegador/interfaz/sistema-diseno";

// "¿Eliminar a Marta?": la persona pierde su código y el de las salas que tenía. No se deshace.
export function ConfirmarEliminacion({
  nombre,
  alEliminar,
  alCerrar,
}: {
  nombre: string;
  // Devuelve el motivo si no se pudo (null si salió bien).
  alEliminar: () => Promise<string | null>;
  alCerrar: () => void;
}) {
  const { error, enviando, enviar } = useEnvio(alCerrar);

  return (
    <Modal
      etiqueta="Confirmar eliminación"
      color="rojo"
      ancho={420}
      titulo={`¿Eliminar a ${nombre}?`}
      alCerrar={alCerrar}
    >
      <p className="mb-8 text-sm leading-relaxed text-ink/70">
        Va a perder su código de acceso y el de las salas que tenía asignadas. Esta acción no se
        puede deshacer.
      </p>
      <PieDeModal error={error} alCancelar={alCerrar}>
        <button
          type="button"
          disabled={enviando}
          onClick={() => void enviar(alEliminar)}
          className="inline-flex items-center gap-2 border-[3px] border-[#b8241f] bg-[#b8241f] px-6 py-3 font-mono text-xs font-bold tracking-widest text-canvas uppercase transition-colors hover:bg-[#9c1e1a] disabled:opacity-30"
        >
          Eliminar →
        </button>
      </PieDeModal>
    </Modal>
  );
}
