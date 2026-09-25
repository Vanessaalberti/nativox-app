import { LIMITES_DE_ESTIMACION } from "@compartido/contratos";
import { Campo } from "@navegador/interfaz/sistema-diseno";
import { acotar, estimarNube, type Duracion } from "../estimador";

const usd = (valor: number) =>
  `$${valor.toLocaleString("es", { minimumFractionDigits: valor < 1 ? 3 : 2, maximumFractionDigits: valor < 1 ? 3 : 2 })}`;

const CAMPOS: {
  clave: keyof Duracion;
  etiqueta: string;
  limites: { minimo: number; maximo: number };
}[] = [
  { clave: "salasSimultaneas", etiqueta: "Salas a la vez", limites: LIMITES_DE_ESTIMACION.salas },
  { clave: "horasPorDia", etiqueta: "Horas por día", limites: LIMITES_DE_ESTIMACION.horas },
  { clave: "dias", etiqueta: "Días", limites: LIMITES_DE_ESTIMACION.dias },
];

// "¿Cuánto va a durar?" y lo que costaría la nube si se usara en todas las salas. El modo principal
// (en las computadoras de las salas) no cuesta nada, así que el número principal es $0.
export function EstimadorDeCosto({
  duracion,
  diasDeLasFechas,
  alCambiar,
  nubeActivada,
  alCambiarNube,
}: {
  duracion: Duracion;
  // Los días que salen de las fechas del evento (null si no se pusieron las dos): no se editan.
  diasDeLasFechas: number | null;
  alCambiar: (duracion: Duracion) => void;
  nubeActivada: boolean;
  alCambiarNube: (activada: boolean) => void;
}) {
  const nube = estimarNube(duracion);

  return (
    <>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
          ¿Cuánto va a durar?
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {CAMPOS.map(({ clave, etiqueta, limites }) => (
            <Campo
              key={clave}
              etiqueta={etiqueta}
              tipo="number"
              valor={String(
                clave === "dias" && diasDeLasFechas !== null ? diasDeLasFechas : duracion[clave],
              )}
              soloLectura={clave === "dias" && diasDeLasFechas !== null}
              minimo={limites.minimo}
              maximo={limites.maximo}
              acento="verde"
              alCambiar={(texto) =>
                alCambiar({ ...duracion, [clave]: acotar(texto, limites, duracion[clave]) })
              }
            />
          ))}
        </div>
        {diasDeLasFechas !== null && (
          <p className="font-mono text-[11px] text-ink/60">
            Los días salen de las fechas del evento. Para cambiarlos, cambiá las fechas.
          </p>
        )}
      </fieldset>

      <section className="flex flex-col gap-3 border-[1.5px] border-verde bg-verde/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl leading-none uppercase">En tus computadoras</h3>
            <span className="font-mono text-[10px] font-bold tracking-widest text-[#2f8a70] uppercase">
              Recomendado
            </span>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl leading-none">$0</p>
            <p className="font-mono text-[10px] tracking-widest text-ink/60 uppercase">
              costo estimado del evento
            </p>
          </div>
        </div>
        <ul className="flex flex-col gap-1 text-sm text-ink/80">
          <li>✓ Gratis y sin límite de uso</li>
          <li>✓ Sigue funcionando sin internet (en la pantalla por cable)</li>
          <li>✓ Whisper turbo + Bergamot: la traducción aparece al instante</li>
          <li>✓ Vos elegís la velocidad: de frases completas a texto casi instantáneo</li>
          <li className="text-ink/60">
            ✕ Rinde según cada computadora: evaluala antes del evento (un clic, sin instalar nada)
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3 border-[1.5px] border-ink/25 bg-canvas p-4">
        <h3 className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
          Transcripción en la nube (opcional)
        </h3>
        <p className="text-sm text-ink/70">
          Whisper en Workers AI, dentro de tu propia cuenta de Cloudflare. No pide ninguna key.
          Conviene solo si una computadora no tiene una placa de video compatible o no llega en vivo
          ni en modo Ahorro. La velocidad no mejora mucho: la manda cómo se corta el audio.
        </p>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={nubeActivada}
            onChange={(evento) => alCambiarNube(evento.target.checked)}
            className="mt-1 accent-[#2f8a70]"
          />
          Usar la nube como respaldo en las computadoras que no lleguen
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-display text-3xl leading-none">{usd(nube.usdTotal)}</p>
            <p className="font-mono text-[10px] tracking-widest text-ink/60 uppercase">
              si todas las salas transcribieran en la nube
            </p>
          </div>
          <div>
            <p className="font-display text-3xl leading-none">
              {nube.horasGratisPorDia.toLocaleString("es", { maximumFractionDigits: 0 })} h
            </p>
            <p className="font-mono text-[10px] tracking-widest text-ink/60 uppercase">
              gratis por día (de charla en una sala)
            </p>
          </div>
        </div>
        <p className="font-mono text-[11px] text-ink/60">
          ~{usd(nube.usdPorHoraDeSala)} por hora de sala (se factura ~120 % del audio hablado); lo
          gratis se renueva cada día. Se cobra en tu cuenta de Cloudflare, nunca acá.
        </p>
      </section>
    </>
  );
}
