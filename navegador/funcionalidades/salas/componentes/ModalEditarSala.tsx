import { useState } from "react";
import type { DatosDeSala, Sala } from "@compartido/contratos";
import {
  Campo,
  Modal,
  PieDeFormulario,
  ZonaDeEliminar,
  useEnvio,
} from "@navegador/interfaz/sistema-diseno";
import { SelectorDeIdiomas, type IdiomasDeSala } from "./SelectorDeIdiomas";

// Cambiar el nombre y los idiomas de una sala, o eliminarla (con sus charlas, previa confirmación).
export function ModalEditarSala({
  sala,
  alGuardar,
  alEliminar,
  alCerrar,
}: {
  sala: Sala;
  // Las dos devuelven el motivo si no se pudo (null si salió bien).
  alGuardar: (datos: DatosDeSala) => Promise<string | null>;
  alEliminar: () => Promise<string | null>;
  alCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(sala.nombre);
  const [idiomas, setIdiomas] = useState<IdiomasDeSala>({
    original: sala.idiomaOriginal,
    destino: sala.idiomasDestino,
  });
  const { error, enviando, enviar } = useEnvio(alCerrar);

  return (
    <Modal etiqueta="Sala" titulo="Editar sala" alCerrar={alCerrar}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar(() =>
            alGuardar({
              nombre,
              idiomaOriginal: idiomas.original,
              idiomasDestino: idiomas.destino,
            }),
          );
        }}
      >
        <Campo etiqueta="Nombre" valor={nombre} alCambiar={setNombre} autoComplete="off" />
        <SelectorDeIdiomas valor={idiomas} alCambiar={setIdiomas} />
        <PieDeFormulario error={error} deshabilitado={enviando || nombre.trim() === ""} />
      </form>

      <ZonaDeEliminar
        etiqueta="Eliminar sala"
        aviso={`Se borra la sala «${sala.nombre}»${sala.charlas > 0 ? ` y sus ${String(sala.charlas)} charlas` : ""}. No se puede deshacer.`}
        enviando={enviando}
        alEliminar={() => void enviar(alEliminar)}
      />
    </Modal>
  );
}
