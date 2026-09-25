import { useState } from "react";
import type { Operador, OperadorConCodigo, Sala } from "@compartido/contratos";
import { Boton, CargaConReintento, EstadoVacio } from "@navegador/interfaz/sistema-diseno";
import { useEquipo } from "../hooks/useEquipo";
import { ModalAgregarPersonas } from "./ModalAgregarPersonas";
import { ModalDeCodigos } from "./ModalDeCodigos";
import { ModalEditarOperador } from "./ModalEditarOperador";
import { SelectorDeSalas } from "./SelectorDeSalas";

const cabecera = "px-5 py-3 text-left font-mono text-[10px] font-bold tracking-widest uppercase";

const resumenDeSalas = (operador: Operador, salas: readonly Sala[]) => {
  const nombres = salas
    .filter((sala) => operador.salaIds.includes(sala.id))
    .map((sala) => sala.nombre);
  return nombres.length === 0 ? "Sin salas" : nombres.join(", ");
};

const ultimoIngreso = (operador: Operador) =>
  operador.ultimoIngreso === null
    ? "todavía no entró"
    : `entró el ${new Date(operador.ultimoIngreso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}`;

// La pestaña "Operadores": el equipo, las salas de cada persona y sus códigos de invitación.
export function PanelDeOperadores() {
  const equipo = useEquipo();
  const [agregando, setAgregando] = useState(false);
  const [editado, setEditado] = useState<Operador | null>(null);
  const [codigos, setCodigos] = useState<{ nombre: string; codigo: string }[] | null>(null);
  const { carga } = equipo;

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
  const mostrarCodigos = (creados: OperadorConCodigo[]) => {
    setAgregando(false);
    setCodigos(creados.map(({ nombre, codigo }) => ({ nombre, codigo })));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[560px] text-base text-ink/80">
          Sumá a tu equipo y asignales las salas que van a operar. Cada persona entra con su código
          de invitación y solo ve sus salas.
        </p>
        <Boton onClick={() => setAgregando(true)}>+ Agregar persona</Boton>
      </div>

      {salas.length === 0 && (
        <p className="font-mono text-xs text-ink/60">
          Todavía no creaste salas — podés sumar gente igual y asignarles salas después, desde la
          pestaña Salas.
        </p>
      )}

      {operadores.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no sumaste a nadie"
          texto="Cada persona que agregues recibe un código de invitación con acceso solo a las salas que le asignes."
        />
      ) : (
        <div className="overflow-x-auto border-[1.5px] border-ink/25 bg-canvas">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-linea-fuerte">
              <tr>
                <th className={cabecera}>Nombre</th>
                <th className={cabecera}>Salas asignadas</th>
                <th className={cabecera}>Estado</th>
                <th className={cabecera}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {operadores.map((operador) => (
                <tr key={operador.id} className="border-b border-linea last:border-0">
                  <td className="px-5 py-3.5 font-mono text-sm">{operador.nombre}</td>
                  <td className="px-5 py-3.5 text-sm text-ink/80">
                    <details className="relative">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 hover:text-ink">
                        {resumenDeSalas(operador, salas)} <span className="text-ink/40">▾</span>
                      </summary>
                      <div className="absolute left-0 z-10 mt-1 max-h-[200px] min-w-[200px] overflow-y-auto border-[1.5px] border-ink bg-canvas p-3">
                        <SelectorDeSalas
                          salas={salas}
                          elegidas={operador.salaIds}
                          alCambiar={(salaIds) =>
                            void equipo.editar(operador.id, { nombre: operador.nombre, salaIds })
                          }
                        />
                      </div>
                    </details>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase ${operador.estado === "activo" ? "bg-verde/25" : "bg-ink/10 text-ink/70"}`}
                    >
                      {operador.estado === "activo" ? "Activo" : "Invitado"}
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-ink/50">
                      {ultimoIngreso(operador)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditado(operador)}
                      className="font-mono text-[11px] font-bold tracking-widest uppercase underline hover:text-naranja"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          alPedirCodigo={async () => {
            const respuesta = await equipo.pedirCodigo(editado.id);
            if ("motivo" in respuesta) return respuesta.motivo;
            setCodigos([{ nombre: editado.nombre, codigo: respuesta.codigo }]);
            return null;
          }}
          alEliminar={() => equipo.eliminar(editado.id)}
          alCerrar={() => setEditado(null)}
        />
      )}
      {codigos && <ModalDeCodigos codigos={codigos} alCerrar={() => setCodigos(null)} />}
    </div>
  );
}
