import type { Charla } from "@compartido/contratos";
import { diaCorto, formatearMinutos, NOMBRES_DE_DIA } from "../fechas";

const ALTO_DE_HORA_PX = 48;

// La semana en una grilla: una columna por día y una fila por hora. Un clic en un espacio vacío
// crea una charla ahí; un clic en una charla la selecciona.
export function GrillaSemanal({
  semana,
  charlas,
  horaInicio,
  horaFin,
  seleccionada,
  alCrearEn,
  alElegir,
}: {
  semana: readonly string[];
  charlas: readonly Charla[];
  // Las horas que se muestran (la última es exclusiva).
  horaInicio: number;
  horaFin: number;
  seleccionada: string | null;
  // Sin esto (solo lectura) los espacios vacíos no hacen nada.
  alCrearEn?: ((fecha: string, minutos: number) => void) | undefined;
  alElegir: (id: string) => void;
}) {
  const horas = Array.from({ length: horaFin - horaInicio }, (_, indice) => horaInicio + indice);

  return (
    <div className="overflow-x-auto border-[1.5px] border-ink/25 bg-canvas">
      <div className="grid min-w-[760px] grid-cols-[56px_repeat(7,minmax(0,1fr))]">
        <div className="border-b border-linea-fuerte" />
        {semana.map((fecha, indice) => (
          <div
            key={fecha}
            className="border-b border-l border-linea-fuerte py-2 text-center font-mono text-[10px] font-bold tracking-widest uppercase"
          >
            {(NOMBRES_DE_DIA[indice] ?? "").slice(0, 3)}{" "}
            <span className="text-ink/50">{diaCorto(fecha)}</span>
          </div>
        ))}

        <div>
          {horas.map((hora) => (
            <div
              key={hora}
              style={{ height: ALTO_DE_HORA_PX }}
              className="pt-1 pr-2 text-right font-mono text-[10px] font-bold text-ink/70"
            >
              {formatearMinutos(hora * 60)}
            </div>
          ))}
        </div>

        {semana.map((fecha, indice) => (
          <div key={fecha} className="relative border-l border-linea-fuerte">
            {horas.map((hora) => (
              <button
                key={hora}
                type="button"
                style={{ height: ALTO_DE_HORA_PX }}
                aria-label={`${alCrearEn === undefined ? "Espacio libre" : "Crear una actividad"} el ${NOMBRES_DE_DIA[indice] ?? ""} ${diaCorto(fecha)} a las ${formatearMinutos(hora * 60)}`}
                disabled={alCrearEn === undefined}
                onClick={() => alCrearEn?.(fecha, hora * 60)}
                className="block w-full border-t border-linea enabled:hover:bg-naranja/10"
              />
            ))}
            {charlas
              .filter((charla) => charla.fecha === fecha)
              .map((charla) => (
                <button
                  key={charla.id}
                  type="button"
                  onClick={() => alElegir(charla.id)}
                  aria-pressed={charla.id === seleccionada}
                  style={{
                    top: ((charla.inicioMin - horaInicio * 60) / 60) * ALTO_DE_HORA_PX,
                    height: Math.max(
                      20,
                      ((charla.finMin - charla.inicioMin) / 60) * ALTO_DE_HORA_PX,
                    ),
                  }}
                  className={`absolute right-px left-px overflow-hidden p-1.5 text-left ${charla.id === seleccionada ? "border-2 border-[#b8241f] bg-naranja" : "border border-[#b8241f]/60 bg-naranja/70 hover:bg-naranja"}`}
                >
                  <span className="block truncate font-mono text-[10px] leading-tight font-bold">
                    {charla.titulo}
                  </span>
                  <span className="block font-mono text-[9px] leading-tight text-ink/70">
                    {formatearMinutos(charla.inicioMin)}–{formatearMinutos(charla.finMin)}
                  </span>
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
