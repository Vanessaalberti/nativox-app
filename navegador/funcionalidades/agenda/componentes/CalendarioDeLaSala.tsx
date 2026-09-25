import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Charla, DatosDeCharla } from "@compartido/contratos";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
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
export function CalendarioDeLaSala({ salaId }: { salaId: string }) {
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
    <MarcoDeEntrada ancho="ancho" centrado={false}>
      <Link
        to="/panel/salas"
        className="mb-6 font-mono text-[11px] tracking-widest text-ink/50 uppercase hover:text-ink"
      >
        ← Volver a Salas
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
            Calendario semanal
          </span>
          <h1 className="mt-2 font-display text-6xl leading-[0.95] font-extrabold tracking-tight uppercase">
            {sala.nombre}
          </h1>
        </div>
        <Boton
          onClick={() =>
            setEditando({ modo: "nueva", datos: datosNuevos(semana[0] ?? hoy(), 9 * 60) })
          }
        >
          + Agregar al calendario
        </Boton>
      </div>
      <p className="mb-4 max-w-[760px] font-mono text-xs text-ink/60">
        Hacé clic en un espacio vacío para crear una actividad, o usá el botón para cargarla desde
        el formulario. Hacé clic en una actividad para ver el detalle.
      </p>

      <div className="mb-4 flex items-center gap-4 font-mono text-xs">
        <button
          type="button"
          onClick={() => setSemanaElegida(sumarDias(lunes, -7))}
          className="font-bold underline"
        >
          ← Semana anterior
        </button>
        <span>
          {diaCorto(semana[0] ?? lunes)} – {diaCorto(semana[6] ?? lunes)}
        </span>
        <button
          type="button"
          onClick={() => setSemanaElegida(sumarDias(lunes, 7))}
          className="font-bold underline"
        >
          Semana siguiente →
        </button>
        <button
          type="button"
          onClick={() => setSemanaElegida(lunesDe(hoy()))}
          className="underline"
        >
          Hoy
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <GrillaSemanal
          semana={semana}
          charlas={charlas}
          horaInicio={horas.inicio}
          horaFin={horas.fin}
          seleccionada={elegida}
          alCrearEn={(fecha, minutos) =>
            setEditando({ modo: "nueva", datos: datosNuevos(fecha, minutos) })
          }
          alElegir={setElegida}
        />
        {charlaElegida ? (
          <DetalleDeCharla
            key={charlaElegida.id}
            charla={charlaElegida}
            alEditar={() => setEditando({ modo: "editar", charla: charlaElegida })}
            alGuardarGlosario={(datos) => editar(charlaElegida.id, datos)}
          />
        ) : (
          <aside className="border-[1.5px] border-ink/25 bg-canvas p-5">
            <span className="font-mono text-[10px] font-bold tracking-widest text-ink/60 uppercase">
              Detalle
            </span>
            <h2 className="mt-1 font-display text-3xl leading-none uppercase">Nada seleccionado</h2>
            <p className="mt-2 text-sm text-ink/70">
              Seleccioná una actividad del calendario para ver acá su información. Un espacio vacío
              crea una actividad nueva.
            </p>
          </aside>
        )}
      </div>

      {editando && (
        <ModalDeCharla
          inicial={editando.modo === "nueva" ? editando.datos : aDatos(editando.charla)}
          idiomaDeLaSala={sala.idiomaOriginal}
          alGuardar={(datos) =>
            editando.modo === "nueva" ? crear(datos) : editar(editando.charla.id, datos)
          }
          {...(editando.modo === "editar"
            ? {
                alEliminar: async () => {
                  const motivo = await eliminar(editando.charla.id);
                  if (motivo === null) setElegida(null);
                  return motivo;
                },
              }
            : {})}
          alCerrar={() => setEditando(null)}
        />
      )}
    </MarcoDeEntrada>
  );
}
