import { useState } from "react";
import { Link } from "react-router";
import type { Sala } from "@compartido/contratos";
import {
  Boton,
  CargaConReintento,
  EstadoVacio,
  useAlMostrarse,
} from "@navegador/interfaz/sistema-diseno";
import { useSalas } from "../hooks/useSalas";
import { ModalAnadirSala } from "./ModalAnadirSala";
import { ModalEditarSala } from "./ModalEditarSala";

const plural = (cantidad: number, uno: string, varios: string) =>
  `${String(cantidad)} ${cantidad === 1 ? uno : varios}`;

// La pestaña "Salas": una tarjeta por sala (con quién la opera) que abre su calendario, y "Añadir
// sala". Con un solo rol no hay a quién asignar: la tarjeta cuenta las charlas en su lugar.
export function PanelDeSalas({ conEquipo, visible }: { conEquipo: boolean; visible: boolean }) {
  const { carga, recargar, crear, editar, eliminar } = useSalas();
  const [anadiendo, setAnadiendo] = useState(false);
  const [editada, setEditada] = useState<Sala | null>(null);
  useAlMostrarse(visible, () => void recargar());

  if (carga.fase !== "lista") {
    return (
      <CargaConReintento
        carga={carga}
        textoCargando="Cargando salas…"
        alReintentar={() => void recargar()}
      />
    );
  }

  const { salas, operadoresPorSala } = carga;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink/60">
          {conEquipo
            ? "Creá las salas de tu evento antes de sumar operadores."
            : "Creá las salas de tu evento y armá la agenda de cada una."}
        </p>
        <button
          type="button"
          onClick={() => setAnadiendo(true)}
          className="inline-flex items-center gap-2 border-[3px] border-[#b8241f] bg-naranja px-5 py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors hover:bg-[#e67b00]"
        >
          + Añadir sala
        </button>
      </div>

      {salas.length === 0 ? (
        <div className="flex-1">
          <EstadoVacio
            titulo="Todavía no armaste ninguna sala"
            texto="Creá la primera (o varias de una) y después vas a poder asignárselas a tu equipo."
          >
            <Boton onClick={() => setAnadiendo(true)}>+ Nueva sala</Boton>
          </EstadoVacio>
        </div>
      ) : (
        <ul className="grid flex-1 grid-cols-1 content-start gap-5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {salas.map((sala) => {
            const asignados = operadoresPorSala[sala.id] ?? 0;
            // Con un solo rol quien administra también opera: la tarjeta trae lo que en el otro
            // caso ve el operador (entrar en vivo, calendario, monitoreo).
            if (!conEquipo) {
              return (
                <li
                  key={sala.id}
                  className="relative flex flex-col border-[1.5px] border-[#443d30] bg-canvas p-5"
                >
                  <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
                    Sala
                  </span>
                  <h3 className="mt-1 mb-4 font-display text-2xl leading-none uppercase">
                    {sala.nombre}
                  </h3>
                  <Link
                    to={`/sala/${sala.id}/control`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-4 font-mono text-xs font-bold tracking-widest text-verde uppercase hover:underline"
                  >
                    Entrar en vivo →
                  </Link>
                  <div className="mt-auto flex items-center gap-4 border-t border-[#443d30]/15 pt-4">
                    {[
                      ["Calendario", `/sala/${sala.id}/calendario`],
                      ["Monitoreo", `/sala/${sala.id}/monitoreo`],
                    ].map(([nombre, ruta]) => (
                      <Link
                        key={nombre}
                        to={ruta ?? ""}
                        className="font-mono text-[10px] font-bold tracking-widest text-ink/50 uppercase transition-colors hover:text-ink"
                      >
                        {nombre}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditada(sala)}
                      className="ml-auto font-mono text-[10px] font-bold tracking-widest text-ink/40 uppercase hover:text-ink"
                    >
                      Editar
                    </button>
                  </div>
                </li>
              );
            }
            return (
              <li key={sala.id} className="relative">
                <Link
                  to={`/sala/${sala.id}/calendario`}
                  className="block h-full border-[1.5px] border-[#443d30] bg-canvas p-5 transition-colors hover:border-ink"
                >
                  <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
                    Sala
                  </span>
                  <h3 className="mt-1 mb-3 font-display text-2xl leading-none uppercase">
                    {sala.nombre}
                  </h3>
                  <p className="text-xs text-ink/60">
                    {asignados === 0
                      ? "Sin asignar"
                      : `${plural(asignados, "operador", "operadores")} ${asignados === 1 ? "asignado" : "asignados"}`}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => setEditada(sala)}
                  className="absolute top-4 right-4 font-mono text-[10px] font-bold tracking-widest text-ink/40 uppercase hover:text-ink"
                >
                  Editar
                </button>
              </li>
            );
          })}
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
