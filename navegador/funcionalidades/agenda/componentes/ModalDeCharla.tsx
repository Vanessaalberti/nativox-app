import { useState } from "react";
import {
  IDIOMAS,
  NOMBRES_DE_IDIOMA,
  esquemaIdioma,
  validar,
  type DatosDeCharla,
  type Idioma,
} from "@compartido/contratos";
import {
  Aviso,
  Boton,
  Campo,
  Modal,
  Seleccion,
  ZonaDeEliminar,
  useEnvio,
} from "@navegador/interfaz/sistema-diseno";
import { formatearMinutos } from "../fechas";

// Cada 15 minutos del día: 00:00 a 23:45 para empezar y 00:15 a 24:00 para terminar.
const MOMENTOS = Array.from({ length: 96 }, (_, indice) => indice * 15);
const comoOpcion = (minutos: number) => ({ valor: minutos, texto: formatearMinutos(minutos) });

// Crear o editar una charla. El glosario no se edita acá: tiene su lugar en el detalle.
export function ModalDeCharla({
  inicial,
  idiomaDeLaSala,
  alGuardar,
  alEliminar,
  alCerrar,
}: {
  inicial: DatosDeCharla;
  idiomaDeLaSala: Idioma;
  // Devuelven el motivo si no se pudo (null si salió bien). `alEliminar` solo al editar.
  alGuardar: (datos: DatosDeCharla) => Promise<string | null>;
  alEliminar?: () => Promise<string | null>;
  alCerrar: () => void;
}) {
  const [datos, setDatos] = useState(inicial);
  const { error, enviando, enviar } = useEnvio();
  const cambiar = (parcial: Partial<DatosDeCharla>) => setDatos({ ...datos, ...parcial });

  const ejecutar = async (accion: () => Promise<string | null>) => {
    if ((await enviar(accion)) === null) alCerrar();
  };

  // Si el inicio pasa al final, la charla se corre entera para no quedar al revés.
  const cambiarInicio = (inicioMin: number) =>
    cambiar({
      inicioMin,
      finMin: datos.finMin > inicioMin ? datos.finMin : Math.min(1440, inicioMin + 60),
    });

  const cambiarIdioma = (texto: string) => {
    const idioma = validar(esquemaIdioma, texto);
    cambiar({ idioma: idioma.ok ? idioma.valor : null });
  };

  const finesPosibles = [...MOMENTOS.filter((minutos) => minutos > datos.inicioMin), 1440];

  return (
    <Modal
      etiqueta="Agenda"
      titulo={alEliminar ? "Editar actividad" : "Nueva actividad"}
      alCerrar={alCerrar}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(evento) => {
          evento.preventDefault();
          void ejecutar(() => alGuardar(datos));
        }}
      >
        <Campo
          etiqueta="Título"
          valor={datos.titulo}
          alCambiar={(titulo) => cambiar({ titulo })}
          autoComplete="off"
        />
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Resumen (opcional)
          </span>
          <textarea
            value={datos.resumen}
            onChange={(evento) => cambiar({ resumen: evento.target.value })}
            rows={3}
            className="w-full border-[1.5px] border-ink/25 bg-canvas px-3 py-3 font-mono text-sm outline-none focus:border-naranja"
          />
          <span className="font-mono text-[11px] text-ink/60">
            Con un resumen, «Sugerir términos» encuentra mejores términos para el glosario.
          </span>
        </label>
        <Campo
          etiqueta="Oradores (opcional)"
          valor={datos.oradores}
          alCambiar={(oradores) => cambiar({ oradores })}
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
            etiqueta="Empieza"
            valor={datos.inicioMin}
            alCambiar={(texto) => cambiarInicio(Number(texto))}
            opciones={MOMENTOS.map(comoOpcion)}
          />
          <Seleccion
            etiqueta="Termina"
            valor={datos.finMin}
            alCambiar={(texto) => cambiar({ finMin: Number(texto) })}
            opciones={finesPosibles.map(comoOpcion)}
          />
        </div>
        <Seleccion
          etiqueta="Idioma de la charla"
          valor={datos.idioma ?? ""}
          alCambiar={cambiarIdioma}
          opciones={[
            { valor: "", texto: `El de la sala (${NOMBRES_DE_IDIOMA[idiomaDeLaSala]})` },
            ...IDIOMAS.map((idioma) => ({ valor: idioma, texto: NOMBRES_DE_IDIOMA[idioma] })),
          ]}
        />

        {error !== null && <Aviso tipo="error">{error}</Aviso>}
        <div className="flex justify-end">
          <Boton
            type="submit"
            disabled={enviando || datos.titulo.trim() === "" || datos.fecha === ""}
          >
            Guardar →
          </Boton>
        </div>
      </form>

      {alEliminar && (
        <ZonaDeEliminar
          etiqueta="Eliminar actividad"
          aviso={`Se borra «${datos.titulo}». No se puede deshacer.`}
          enviando={enviando}
          alEliminar={() => void ejecutar(alEliminar)}
        />
      )}
    </Modal>
  );
}
