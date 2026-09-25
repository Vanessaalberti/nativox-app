import { useState } from "react";
import { Link } from "react-router";
import type { Sala } from "@compartido/contratos";
import { Boton } from "@navegador/interfaz/sistema-diseno";
import { useSalas } from "../hooks/useSalas";
import { describirIdiomas } from "../idiomas";
import { ModalAnadirSala } from "./ModalAnadirSala";
import { ModalEditarSala } from "./ModalEditarSala";

const enlace =
  "font-mono text-[11px] font-bold tracking-widest uppercase underline hover:text-naranja";

// La pestaña "Salas" del panel: las salas del evento, con sus idiomas y sus charlas, y los accesos
// al calendario y a la sesión en vivo de cada una.
export function PanelDeSalas() {
  const { carga, recargar, crear, editar, eliminar } = useSalas();
  const [anadiendo, setAnadiendo] = useState(false);
  const [editada, setEditada] = useState<Sala | null>(null);

  if (carga.fase === "cargando") {
    return (
      <p role="status" className="font-mono text-sm text-ink/70">
        Cargando salas…
      </p>
    );
  }
  if (carga.fase === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="font-mono text-sm text-[#b8241f]">
          {carga.motivo}
        </p>
        <Boton variante="secundario" onClick={() => void recargar()}>
          Probar de nuevo
        </Boton>
      </div>
    );
  }

  const { salas } = carga;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[560px] text-base text-ink/80">
          Creá las salas de tu evento — desde acá las administrás y las operás en vivo.
        </p>
        <Boton onClick={() => setAnadiendo(true)}>+ Añadir sala</Boton>
      </div>

      {salas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-[1.5px] border-dashed border-ink/30 px-6 py-16 text-center">
          <span className="font-display text-5xl text-naranja">+</span>
          <h2 className="font-display text-3xl uppercase">Todavía no armaste ninguna sala</h2>
          <p className="text-sm text-ink/70">
            Creá la primera (o varias de una) para empezar a transmitir.
          </p>
          <Boton onClick={() => setAnadiendo(true)}>+ Nueva sala</Boton>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {salas.map((sala) => (
            <li
              key={sala.id}
              className="flex flex-wrap items-center justify-between gap-4 border-[1.5px] border-ink/25 bg-canvas p-4"
            >
              <div>
                <h2 className="font-display text-3xl leading-none uppercase">{sala.nombre}</h2>
                <p className="mt-1 font-mono text-xs text-ink/60">
                  {describirIdiomas(sala.idiomaOriginal, sala.idiomasDestino)} · {sala.charlas}{" "}
                  {sala.charlas === 1 ? "charla" : "charlas"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link to={`/sala/${sala.id}/calendario`} className={enlace}>
                  Calendario
                </Link>
                <Link to={`/sala/${sala.id}/control`} className={enlace}>
                  Abrir en vivo
                </Link>
                <button type="button" onClick={() => setEditada(sala)} className={enlace}>
                  Editar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {anadiendo && (
        <ModalAnadirSala
          cantidadActual={salas.length}
          alCrear={crear}
          alCerrar={() => setAnadiendo(false)}
        />
      )}
      {editada && (
        <ModalEditarSala
          sala={editada}
          alGuardar={(datos) => editar(editada.id, datos)}
          alEliminar={() => eliminar(editada.id)}
          alCerrar={() => setEditada(null)}
        />
      )}
    </div>
  );
}
