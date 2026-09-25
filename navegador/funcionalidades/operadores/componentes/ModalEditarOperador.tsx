import { useState } from "react";
import type { Operador } from "@compartido/contratos";
import {
  Aviso,
  Boton,
  Campo,
  Modal,
  PieDeFormulario,
  ZonaDeEliminar,
  useEnvio,
} from "@navegador/interfaz/sistema-diseno";

// Cambiar el nombre, pedir un código nuevo (el anterior deja de servir y se cierra su sesión) o
// eliminar a la persona.
export function ModalEditarOperador({
  operador,
  alCambiarNombre,
  alPedirCodigo,
  alEliminar,
  alCerrar,
}: {
  operador: Operador;
  // Devuelven el motivo si no se pudo (null si salió bien).
  alCambiarNombre: (nombre: string) => Promise<string | null>;
  alPedirCodigo: () => Promise<string | null>;
  alEliminar: () => Promise<string | null>;
  alCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(operador.nombre);
  const [pidiendo, setPidiendo] = useState(false);
  const { error, enviando, enviar } = useEnvio(alCerrar);

  return (
    <Modal etiqueta="Equipo" titulo={operador.nombre} alCerrar={alCerrar}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar(() => alCambiarNombre(nombre));
        }}
      >
        <Campo etiqueta="Nombre" valor={nombre} alCambiar={setNombre} autoComplete="off" />
        <PieDeFormulario error={error} deshabilitado={enviando || nombre.trim() === ""} />
      </form>

      <div className="mt-8 flex flex-col gap-3 border-t border-linea-fuerte pt-5">
        {pidiendo ? (
          <>
            <Aviso>
              El código actual de {operador.nombre} deja de servir y se cierra su sesión. Después
              vas a ver el código nuevo.
            </Aviso>
            <div className="flex gap-3">
              <Boton variante="secundario" onClick={() => setPidiendo(false)}>
                Cancelar
              </Boton>
              <Boton disabled={enviando} onClick={() => void enviar(alPedirCodigo)}>
                Generar código nuevo
              </Boton>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setPidiendo(true)}
            className="self-start font-mono text-xs tracking-widest uppercase underline"
          >
            Generar un código nuevo
          </button>
        )}
      </div>

      <ZonaDeEliminar
        etiqueta="Eliminar persona"
        aviso={`${operador.nombre} pierde el acceso al instante. No se puede deshacer.`}
        enviando={enviando}
        alEliminar={() => void enviar(alEliminar)}
      />
    </Modal>
  );
}
