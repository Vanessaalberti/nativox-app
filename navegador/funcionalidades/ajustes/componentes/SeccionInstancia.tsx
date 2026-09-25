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
        titulo="Tu instancia"
        texto="Corre en tu propia cuenta de Cloudflare. Guarda salas, staff, glosario y los ajustes."
      >
        <p className="font-mono text-sm font-bold">{direccion}</p>
        <ul className="flex flex-col gap-1 font-mono text-xs text-ink/75">
          <li>✓ Base de datos</li>
          <li>✓ Tiempo real</li>
        </ul>
        <div>
          <a
            href="https://dash.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] font-bold tracking-widest uppercase underline hover:text-naranja"
          >
            Abrir panel de Cloudflare ↗
          </a>
        </div>
      </Seccion>

      <section className="flex flex-col gap-4 border-[1.5px] border-[#b8241f] bg-[#b8241f]/5 p-6">
        <h2 className="font-display text-4xl leading-none text-[#b8241f] uppercase">
          Zona de peligro
        </h2>
        <h3 className="font-mono text-[11px] font-bold tracking-widest uppercase">
          Eliminar tu evento
        </h3>
        <p className="max-w-[760px] text-sm text-ink/80">
          Pensado para cuando termina el evento y ya no querés seguir con esta instancia activa.
          Borra todos los datos: salas, agenda, glosarios, equipo, salidas de producción, ajustes y
          tu cuenta. Después te guiamos para borrar la instancia de tu cuenta de Cloudflare (lleva 2
          minutos). No se puede deshacer.
        </p>
        <div>
          <Boton onClick={() => setEliminando(true)}>Eliminar evento →</Boton>
        </div>
      </section>

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
