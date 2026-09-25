import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Charla, DatosDeCharla } from "@compartido/contratos";
import { MarcoDeEntrada, MarcoDelPanel } from "@navegador/interfaz/marco-de-entrada";
import { Boton } from "@navegador/interfaz/sistema-diseno";
import { aDatos } from "../datos-de-charla";
import { diaCorto, hoy, lunesDe, semanaDesde, sumarDias } from "../fechas";
import { useAgenda } from "../hooks/useAgenda";
import { DetalleDeCharla } from "./DetalleDeCharla";
import { GrillaSemanal } from "./GrillaSemanal";
import { ModalDeCharla } from "./ModalDeCharla";

// Las horas que muestra la grilla por defecto; se amplían si una charla queda afuera.
const HORA_DE_INICIO = 8;
const HORA_DE_FIN = 22;

type Editando = { modo: "nueva"; datos: DatosDeCharla } | { modo: "editar"; charla: Charla };

const datosNuevos = (fecha: string, inicioMin: number): DatosDeCharla => ({
  titulo: "",
  resumen: "",
  oradores: "",
  fecha,
  inicioMin,
  finMin: Math.min(1440, inicioMin + 60),
  idioma: null,
  glosario: "",
});

// /sala/:id/calendario — la agenda semanal de la sala: charlas con horario, idioma, resumen y
// oradores, y el glosario de cada una.
export function CalendarioDeLaSala({
  salaId,
  soloLectura = false,
}: {
  salaId: string;
  // Un operador ve la agenda de sus salas pero no la cambia.
  soloLectura?: boolean;
}) {
  const { carga, recargar, crear, editar, eliminar } = useAgenda(salaId);
  const [semanaElegida, setSemanaElegida] = useState<string | null>(null);
  const [elegida, setElegida] = useState<string | null>(null);
  const [editando, setEditando] = useState<Editando | null>(null);

  const charlas = carga.fase === "lista" ? carga.charlas : [];
  const inicioDelEvento = carga.fase === "lista" ? carga.inicioDelEvento : null;
  const lunes = semanaElegida ?? lunesDe(inicioDelEvento ?? hoy());
  const semana = useMemo(() => semanaDesde(lunes), [lunes]);
  const horas = useMemo(() => {
    const inicios = charlas.map((charla) => Math.floor(charla.inicioMin / 60));
    const fines = charlas.map((charla) => Math.ceil(charla.finMin / 60));
    return {
      inicio: Math.min(HORA_DE_INICIO, ...inicios),
      fin: Math.max(HORA_DE_FIN, ...fines),
    };
  }, [charlas]);

  if (carga.fase === "cargando") {
    return (
      <MarcoDeEntrada>
        <p role="status" className="font-mono text-sm">
          Abriendo el calendario…
        </p>
      </MarcoDeEntrada>
    );
  }
  if (carga.fase === "error") {
    return (
      <MarcoDeEntrada>
        <div className="flex flex-col items-center gap-4">
          <p role="alert" className="font-mono text-sm text-[#b8241f]">
            {carga.motivo}
          </p>
          <Boton variante="secundario" onClick={() => void recargar()}>
            Probar de nuevo
          </Boton>
        </div>
      </MarcoDeEntrada>
    );
  }

  const { sala } = carga;
  const charlaElegida = charlas.find((charla) => charla.id === elegida) ?? null;

  return (
    <MarcoDelPanel
      libre
      rotulo={["CALENDARIO", "DE SALA"]}
      junto={
        <Link
          to={soloLectura ? "/operador" : "/panel/salas"}
          className="inline-flex items-center gap-1 font-mono text-[11px] tracking-widest text-ink/50 uppercase transition-colors hover:text-ink"
        >
          <span>←</span> {soloLectura ? "Volver a mis salas" : "Volver a Salas"}
        </Link>
      }
      acciones={
        <span className="bg-verde px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase">
          {soloLectura ? "Operador" : "Admin"}
        </span>
      }
    >
      <div className="flex-1 px-8 py-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
              Calendario semanal
            </span>
            <h1 className="mt-2 mb-1 font-display text-4xl leading-[0.95] font-extrabold tracking-tight uppercase md:text-5xl">
              {sala.nombre}
            </h1>
          </div>
          {!soloLectura && (
            <button
              type="button"
              onClick={() =>
                setEditando({ modo: "nueva", datos: datosNuevos(semana[0] ?? hoy(), 9 * 60) })
              }
              className="inline-flex shrink-0 items-center gap-2 border-[3px] border-[#b8241f] bg-naranja px-5 py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors hover:bg-[#e67b00]"
            >
              + Agregar al calendario
            </button>
          )}
        </div>
        <p className="mb-4 shrink-0 text-sm text-ink/60">
          {soloLectura
            ? "Hacé clic en una actividad para ver el detalle."
            : "Hacé clic en un espacio vacío para crear una actividad, o usá el botón para cargarla directo desde el formulario. Hacé clic en una actividad para ver el detalle."}
        </p>

        <div className="mb-3 flex shrink-0 flex-wrap items-center gap-4 font-mono text-[11px] tracking-widest text-ink/60 uppercase">
          <button
            type="button"
            onClick={() => setSemanaElegida(sumarDias(lunes, -7))}
            className="font-bold hover:text-ink"
          >
            ← Semana anterior
          </button>
          <span className="text-ink">
            {diaCorto(semana[0] ?? lunes)} – {diaCorto(semana[6] ?? lunes)}
          </span>
          <button
            type="button"
            onClick={() => setSemanaElegida(sumarDias(lunes, 7))}
            className="font-bold hover:text-ink"
          >
            Semana siguiente →
          </button>
          <button
            type="button"
            onClick={() => setSemanaElegida(lunesDe(hoy()))}
            className="hover:text-ink"
          >
            Hoy
          </button>
        </div>

        <GrillaSemanal
          semana={semana}
          charlas={charlas}
          horaInicio={horas.inicio}
          horaFin={horas.fin}
          seleccionada={elegida}
          alCrearEn={
            soloLectura
              ? undefined
              : (fecha, minutos) =>
                  setEditando({ modo: "nueva", datos: datosNuevos(fecha, minutos) })
          }
          alElegir={setElegida}
        />
      </div>

      <aside className="w-full shrink-0 border-t border-[#443d30]/20 bg-canvas px-6 py-8 lg:w-[420px] lg:overflow-y-auto lg:border-t-0 lg:border-l">
        {charlaElegida ? (
          <DetalleDeCharla
            key={charlaElegida.id}
            charla={charlaElegida}
            soloLectura={soloLectura}
            alEditar={() => setEditando({ modo: "editar", charla: charlaElegida })}
            alGuardarGlosario={(datos) => editar(charlaElegida.id, datos)}
            alEliminar={async () => {
              const motivo = await eliminar(charlaElegida.id);
              if (motivo === null) setElegida(null);
              return motivo;
            }}
          />
        ) : (
          <div>
            <span className="font-mono text-[11px] tracking-widest text-ink/50 uppercase">
              Detalle
            </span>
            <h2 className="mt-2 mb-4 font-display text-2xl leading-none uppercase">
              Nada seleccionado
            </h2>
            <p className="text-sm leading-relaxed text-ink/60">
              Seleccioná una actividad del calendario para ver acá su información.
              {!soloLectura && " Un espacio vacío crea una actividad nueva."}
            </p>
          </div>
        )}
      </aside>

      {editando && (
        <ModalDeCharla
          inicial={editando.modo === "nueva" ? editando.datos : aDatos(editando.charla)}
          editando={editando.modo === "editar"}
          alGuardar={(datos) =>
            editando.modo === "nueva" ? crear(datos) : editar(editando.charla.id, datos)
          }
          alCerrar={() => setEditando(null)}
        />
      )}
    </MarcoDelPanel>
  );
}
