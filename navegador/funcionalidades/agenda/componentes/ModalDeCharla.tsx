import { useState } from "react";
import type { DatosDeCharla } from "@compartido/contratos";
import { Campo, Modal, PieDeModal, Seleccion, useEnvio } from "@navegador/interfaz/sistema-diseno";
import { formatearMinutos } from "../fechas";

// Cada 15 minutos del día: 00:00 a 23:45 para empezar y 00:15 a 24:00 para terminar.
const MOMENTOS = Array.from({ length: 96 }, (_, indice) => indice * 15);
const comoOpcion = (minutos: number) => ({ valor: minutos, texto: formatearMinutos(minutos) });

// Crear o editar una actividad del calendario: título, día, desde/hasta y descripción. El idioma,
// los oradores y el glosario no se piden acá: el idioma es el de la sala y el glosario tiene su
// lugar en el detalle. Lo que la charla ya tenga se conserva al editar.
export function ModalDeCharla({
  inicial,
  editando,
  alGuardar,
  alCerrar,
}: {
  inicial: DatosDeCharla;
  editando: boolean;
  // Devuelve el motivo si no se pudo (null si salió bien).
  alGuardar: (datos: DatosDeCharla) => Promise<string | null>;
  alCerrar: () => void;
}) {
  const [datos, setDatos] = useState(inicial);
  const { error, enviando, enviar } = useEnvio(alCerrar);
  const cambiar = (parcial: Partial<DatosDeCharla>) => setDatos({ ...datos, ...parcial });

  // Si el inicio pasa al final, la charla se corre entera para no quedar al revés.
  const cambiarInicio = (inicioMin: number) =>
    cambiar({
      inicioMin,
      finMin: datos.finMin > inicioMin ? datos.finMin : Math.min(1440, inicioMin + 60),
    });

  const finesPosibles = [...MOMENTOS.filter((minutos) => minutos > datos.inicioMin), 1440];

  return (
    <Modal
      etiqueta={editando ? "Editar actividad" : "Nueva actividad"}
      ancho={480}
      titulo={
        editando ? (
          "Editar actividad"
        ) : (
          <>
            Agregar al
            <br />
            calendario
          </>
        )
      }
      alCerrar={alCerrar}
    >
      <div className="flex flex-col gap-5">
        <Campo
          etiqueta="Título"
          valor={datos.titulo}
          alCambiar={(titulo) => cambiar({ titulo })}
          placeholder="Charla principal"
          autoComplete="off"
        />
        <Campo
          etiqueta="Día"
          tipo="date"
          valor={datos.fecha}
          alCambiar={(fecha) => cambiar({ fecha })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Seleccion
            etiqueta="Desde"
            valor={datos.inicioMin}
            alCambiar={(texto) => cambiarInicio(Number(texto))}
            opciones={MOMENTOS.map(comoOpcion)}
          />
          <Seleccion
            etiqueta="Hasta"
            valor={datos.finMin}
            alCambiar={(texto) => cambiar({ finMin: Number(texto) })}
            opciones={finesPosibles.map(comoOpcion)}
          />
        </div>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Descripción
          </span>
          <textarea
            value={datos.resumen}
            onChange={(evento) => cambiar({ resumen: evento.target.value })}
            rows={3}
            placeholder="Opcional"
            className="w-full resize-none border-[1.5px] border-[#443d30] bg-canvas px-4 py-3 text-sm text-ink transition-colors outline-none placeholder:text-ink/30 focus:border-naranja"
          />
        </label>

        <PieDeModal error={error} alCancelar={alCerrar}>
          <button
            type="button"
            disabled={enviando || datos.titulo.trim() === "" || datos.fecha === ""}
            onClick={() => void enviar(() => alGuardar(datos))}
            className="inline-flex items-center gap-2 border-[3px] border-[#b8241f] bg-naranja px-6 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors hover:bg-[#e67b00] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Guardar →
          </button>
        </PieDeModal>
      </div>
    </Modal>
  );
}
