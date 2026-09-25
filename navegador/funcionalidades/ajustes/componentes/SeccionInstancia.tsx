import { useState } from "react";
import type { EventoCompleto } from "@compartido/contratos";
import { Aviso, Boton, Campo, Modal, useEnvio } from "@navegador/interfaz/sistema-diseno";
import { eliminarEvento } from "@navegador/modulos/cliente-instancia";
import { Seccion } from "./Seccion";

// Infraestructura (dónde corre la instancia) y zona de peligro (eliminar el evento).
export function SeccionInstancia({ evento }: { evento: EventoCompleto }) {
  const [eliminando, setEliminando] = useState(false);
  const direccion = window.location.host;

  return (
    <>
      <Seccion
        etiqueta="Infraestructura"
        titulo="Tu instancia"
        texto="Corre en tu propia cuenta de Cloudflare. Guarda salas, staff, glosario, transcripciones y el historial de correcciones."
      >
        <div className="border-[1.5px] border-[#443d30] bg-canvas p-4">
          <p className="font-mono text-sm break-all">{direccion}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["✓ Base de datos", "✓ Tiempo real"].map((estado) => (
              <span
                key={estado}
                className="bg-verde/20 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-verde uppercase"
              >
                {estado}
              </span>
            ))}
          </div>
          <a
            href="https://dash.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-ink/50 uppercase transition-colors hover:text-ink"
          >
            Abrir panel de Cloudflare ↗
          </a>
        </div>
      </Seccion>

      <Seccion etiqueta="Zona de peligro" titulo="Eliminar evento" tipo="peligro">
        <p className="mb-2 max-w-[560px] text-sm leading-relaxed text-ink/70">
          Pensado para cuando termina el evento y ya no querés seguir con esta instancia activa.
          Borra todos los datos, las keys y los códigos de acceso de tu staff. Después te guiamos
          para borrar la instancia de tu cuenta de Cloudflare (lleva 2 minutos). No se puede
          deshacer.
        </p>
        <div>
          <button
            type="button"
            onClick={() => setEliminando(true)}
            className="inline-flex items-center gap-2 border-[3px] border-[#b8241f] bg-[#b8241f] px-6 py-3 font-mono text-xs font-bold tracking-widest text-canvas uppercase transition-colors hover:bg-[#9c1e1a]"
          >
            Eliminar evento →
          </button>
        </div>
      </Seccion>

      {eliminando && <ModalEliminar nombre={evento.nombre} alCerrar={() => setEliminando(false)} />}
    </>
  );
}

function ModalEliminar({ nombre, alCerrar }: { nombre: string; alCerrar: () => void }) {
  const [escrito, setEscrito] = useState("");
  const [borrado, setBorrado] = useState(false);
  const { error, enviando, enviar } = useEnvio();

  if (borrado) {
    return (
      <Modal
        etiqueta="✓ Datos eliminados"
        titulo="Último paso: borrá la instancia"
        alCerrar={() => window.location.assign("/")}
      >
        <div className="flex flex-col gap-4 text-sm">
          <p>
            Tu instancia ya no tiene datos. Para que deje de existir en tu cuenta de Cloudflare:
          </p>
          <ol className="flex list-decimal flex-col gap-2 pl-5">
            <li>Entrá a tu panel de Cloudflare → Workers y Pages.</li>
            <li>Abrí este Worker → Settings → y bajá hasta «Delete» (Eliminar).</li>
            <li>
              Confirmá la eliminación. La base de datos se borra desde Storage y bases de datos →
              D1.
            </li>
          </ol>
          <div className="flex justify-end">
            <Boton onClick={() => window.location.assign("/")}>Listo</Boton>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      etiqueta="Esta acción no se puede deshacer"
      titulo="¿Eliminar tu evento?"
      alCerrar={alCerrar}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar(async () => {
            const respuesta = await eliminarEvento(escrito);
            if (!respuesta.ok) return respuesta.motivo;
            setBorrado(true);
            return null;
          });
        }}
      >
        <ul className="flex flex-col gap-2 text-sm">
          <li>✕ Se borran las salas, calendarios, glosarios, equipo y transcripciones.</li>
          <li>
            → La instancia queda vacía en tu cuenta de Cloudflare. En el paso siguiente te mostramos
            cómo borrarla.
          </li>
        </ul>
        <Campo
          etiqueta={`Escribí «${nombre}» para confirmar`}
          valor={escrito}
          alCambiar={setEscrito}
          autoComplete="off"
        />
        {error !== null && <Aviso tipo="error">{error}</Aviso>}
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={enviando || escrito.trim() !== nombre}>
            Eliminar evento →
          </Boton>
        </div>
      </form>
    </Modal>
  );
}
