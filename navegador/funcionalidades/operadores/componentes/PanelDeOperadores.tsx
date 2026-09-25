import { useRef, useState } from "react";
import type { Operador, OperadorConCodigo } from "@compartido/contratos";
import {
  CargaConReintento,
  useAlMostrarse,
  useFilasQueEntran,
} from "@navegador/interfaz/sistema-diseno";
import { useEquipo } from "../hooks/useEquipo";
import { ConfirmarEliminacion } from "./ConfirmarEliminacion";
import { DesplegableDeSalas } from "./DesplegableDeSalas";
import { ModalAgregarPersonas } from "./ModalAgregarPersonas";
import { ModalDeCodigos } from "./ModalDeCodigos";
import { ModalEditarOperador } from "./ModalEditarOperador";

const ALTO_DE_FILA = 45;
const ALTO_DE_CABECERA = 41;

const cabecera =
  "px-5 py-3 text-left font-mono text-[10px] font-bold tracking-widest uppercase text-ink/50";

const ultimoIngreso = (operador: Operador) =>
  operador.ultimoIngreso === null
    ? "Todavía no entró"
    : `Entró el ${new Date(operador.ultimoIngreso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}`;

function IconoDeBasura() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M5.5 4V2.5C5.5 2.22386 5.72386 2 6 2H10C10.2761 2 10.5 2.22386 10.5 2.5V4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.5 4L4.16667 13C4.20653 13.5539 4.66234 14 5.21739 14H10.7826C11.3377 14 11.7935 13.5539 11.8333 13L12.5 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// La pestaña "Staff": el equipo, las salas de cada persona y sus códigos de invitación. La tabla
// se pagina sola según el alto que tenga la ventana, para que no haya que desplazarse.
export function PanelDeOperadores({
  visible,
  alAbrirSalas,
}: {
  visible: boolean;
  alAbrirSalas: () => void;
}) {
  const equipo = useEquipo();
  const [agregando, setAgregando] = useState(false);
  const [editado, setEditado] = useState<Operador | null>(null);
  const [aEliminar, setAEliminar] = useState<Operador | null>(null);
  const [codigos, setCodigos] = useState<{ nombre: string; codigo: string }[] | null>(null);
  const [pagina, setPagina] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const { carga } = equipo;
  const hayTabla = carga.fase === "lista" && carga.operadores.length > 0;
  const filas = useFilasQueEntran(contenedor, ALTO_DE_FILA, ALTO_DE_CABECERA, visible && hayTabla);
  useAlMostrarse(visible, () => void equipo.recargar());

  if (carga.fase !== "lista") {
    return (
      <CargaConReintento
        carga={carga}
        textoCargando="Cargando el equipo…"
        alReintentar={() => void equipo.recargar()}
      />
    );
  }

  const { operadores, salas } = carga;
  const totalDePaginas = Math.max(1, Math.ceil(operadores.length / filas));
  const paginaActual = Math.min(pagina, totalDePaginas - 1);
  const visibles = operadores.slice(paginaActual * filas, (paginaActual + 1) * filas);

  const mostrarCodigos = (creados: OperadorConCodigo[]) => {
    setAgregando(false);
    setCodigos(creados.map(({ nombre, codigo }) => ({ nombre, codigo })));
  };
  const pedirCodigo = async (operador: Operador): Promise<string | null> => {
    const respuesta = await equipo.pedirCodigo(operador.id);
    if ("motivo" in respuesta) return respuesta.motivo;
    setCodigos([{ nombre: operador.nombre, codigo: respuesta.codigo }]);
    return null;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink/60">
          Sumá a tu equipo y asignales las salas que van a operar.
        </p>
        <button
          type="button"
          onClick={() => setAgregando(true)}
          className="inline-flex items-center gap-2 border-[3px] border-[#b8241f] bg-naranja px-5 py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors hover:bg-[#e67b00]"
        >
          + Agregar persona
        </button>
      </div>

      {salas.length === 0 && (
        <p className="-mt-2 mb-6 shrink-0 text-xs text-ink/50">
          Todavía no creaste salas — podés sumar gente igual y asignarles salas después, desde la
          pestaña{" "}
          <button type="button" onClick={alAbrirSalas} className="text-naranja hover:underline">
            Salas
          </button>
          .
        </p>
      )}

      {operadores.length === 0 ? (
        <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center border-[1.5px] border-dashed border-[#443d30]/60 px-8 py-16 text-center">
          <span className="mb-6 font-mono text-5xl leading-none text-verde">+</span>
          <h2 className="mb-3 font-display text-3xl leading-[0.95] uppercase">
            Todavía no sumaste
            <br />a nadie
          </h2>
          <p className="max-w-[440px] text-base text-ink/70">
            Cada persona que agregues recibe un código de invitación con acceso solo a las salas que
            le asignes.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col border-[1.5px] border-[#443d30] bg-canvas">
          <div ref={contenedor} className="min-h-0 flex-1 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#443d30]/30">
                  <th className={cabecera}>Nombre</th>
                  <th className={cabecera}>Salas asignadas</th>
                  <th className={cabecera}>Código</th>
                  <th className={cabecera}>Estado</th>
                  <th className={`${cabecera} text-right`}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((operador) => (
                  <tr key={operador.id} className="border-b border-[#443d30]/15 last:border-0">
                    <td className="px-5 py-3.5 font-mono text-sm">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => setEditado(operador)}
                        className="text-left hover:underline"
                      >
                        {operador.nombre}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink/70">
                      <DesplegableDeSalas
                        variante="celda"
                        salas={salas}
                        elegidas={operador.salaIds}
                        alCambiar={(salaIds) =>
                          void equipo.editar(operador.id, { nombre: operador.nombre, salaIds })
                        }
                      />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm">
                      <span
                        title="El código se muestra una sola vez, al crearlo"
                        className="text-ink/40"
                      >
                        NTVX-••••-••••
                      </span>{" "}
                      <button
                        type="button"
                        onClick={() => void pedirCodigo(operador)}
                        className="ml-1 font-mono text-[10px] font-bold tracking-widest text-ink/50 uppercase hover:text-ink"
                      >
                        Nuevo
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        title={ultimoIngreso(operador)}
                        className={`px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase ${operador.estado === "activo" ? "bg-verde text-ink" : "bg-verde/20 text-verde"}`}
                      >
                        {operador.estado === "activo" ? "Activo" : "Invitado"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        title="Eliminar"
                        aria-label={`Eliminar a ${operador.nombre}`}
                        onClick={() => setAEliminar(operador)}
                        className="inline-flex text-[#b8241f] transition-colors hover:text-[#8a1a16]"
                      >
                        <IconoDeBasura />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalDePaginas > 1 && (
            <div className="flex shrink-0 items-center justify-between border-t border-[#443d30]/20 px-5 py-3">
              <button
                type="button"
                disabled={paginaActual === 0}
                onClick={() => setPagina(paginaActual - 1)}
                className="font-mono text-xs font-bold tracking-widest text-ink/50 uppercase transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Anterior
              </button>
              <span className="font-mono text-xs text-ink/50">
                Página {paginaActual + 1} de {totalDePaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalDePaginas - 1}
                onClick={() => setPagina(paginaActual + 1)}
                className="font-mono text-xs font-bold tracking-widest text-ink/50 uppercase transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}

      {agregando && (
        <ModalAgregarPersonas
          salas={salas}
          alInvitar={(personas) => equipo.invitar(personas)}
          alTerminar={mostrarCodigos}
          alCerrar={() => setAgregando(false)}
        />
      )}
      {editado && (
        <ModalEditarOperador
          operador={editado}
          alCambiarNombre={(nombre) =>
            equipo.editar(editado.id, { nombre, salaIds: editado.salaIds })
          }
          alPedirCodigo={() => pedirCodigo(editado)}
          alEliminar={() => equipo.eliminar(editado.id)}
          alCerrar={() => setEditado(null)}
        />
      )}
      {aEliminar && (
        <ConfirmarEliminacion
          nombre={aEliminar.nombre}
          alEliminar={() => equipo.eliminar(aEliminar.id)}
          alCerrar={() => setAEliminar(null)}
        />
      )}
      {codigos && <ModalDeCodigos codigos={codigos} alCerrar={() => setCodigos(null)} />}
    </div>
  );
}
