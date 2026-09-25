import { useState } from "react";
import type { Ajustes } from "@compartido/contratos";
import { Aviso, Campo, Interruptor } from "@navegador/interfaz/sistema-diseno";
import { Seccion } from "./Seccion";

// Consumo de IA y subtítulos. La transcripción en la nube es opcional y está apagada por defecto:
// lo que corre en las computadoras de cada sala no consume nada ni tiene límite.
export function SeccionConsumo({
  ajustes,
  alGuardar,
}: {
  ajustes: Ajustes;
  // Devuelve el motivo si no se pudo (null si salió bien).
  alGuardar: (ajustes: Ajustes) => Promise<string | null>;
}) {
  const [tope, setTope] = useState(ajustes.consumo.topeMensualUsd?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  const guardar = async (nuevos: Ajustes) => setError(await alGuardar(nuevos));
  const consumo = (parcial: Partial<Ajustes["consumo"]>) =>
    void guardar({ ...ajustes, consumo: { ...ajustes.consumo, ...parcial } });

  const guardarTope = () => {
    const numero = Number(tope.replace(",", "."));
    if (tope.trim() === "") consumo({ topeMensualUsd: null });
    else if (Number.isFinite(numero) && numero >= 0) consumo({ topeMensualUsd: numero });
    else setError("El tope tiene que ser un número (en dólares) o quedar vacío.");
  };

  return (
    <>
      <Seccion
        etiqueta="Consumo"
        titulo="Consumo de IA"
        texto="Solo aplica si activás la transcripción en la nube (opcional, apagada por defecto): lo que corre en las computadoras de cada sala no consume nada ni tiene límite. La factura exacta está en tu panel de Cloudflare."
      >
        <Interruptor
          etiqueta="Transcripción en la nube como respaldo (opcional)."
          ayuda="Si la computadora de una sala no llega en vivo, transcribe con Whisper en Workers AI. No pide ninguna key; ~$0,037 por hora de sala, con ~3 h gratis por día."
          valor={ajustes.nubeComoRespaldo}
          alCambiar={(valor) => void guardar({ ...ajustes, nubeComoRespaldo: valor })}
        />
        <Aviso>
          Todavía no medimos el consumo desde acá: la cuota gratis del día y el gasto del mes están
          en tu panel de Cloudflare → Workers AI.
        </Aviso>
        <Interruptor
          etiqueta="Tengo el plan Workers Paid activado en Cloudflare ($5/mes)."
          ayuda="Sin él, al agotar la cuota gratis no se cobra nada: se pasa al respaldo."
          valor={ajustes.consumo.workersPaid}
          alCambiar={(valor) => consumo({ workersPaid: valor })}
        />
        <form
          className="flex max-w-[360px] flex-col gap-2"
          onSubmit={(evento) => {
            evento.preventDefault();
            guardarTope();
          }}
        >
          <Campo
            etiqueta="Tope mensual de IA en la nube (USD)"
            tipo="number"
            valor={tope}
            alCambiar={setTope}
            minimo={0}
            placeholder="Sin tope"
            ayuda="Al llegar al tope, la transcripción vuelve a la computadora de cada sala, sin cortarse. Enter para guardar."
          />
        </form>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
            Avisos (a admin y operadores, nunca a la audiencia)
          </legend>
          <Interruptor
            etiqueta="Avisar al 80% de la cuota o del tope"
            valor={ajustes.consumo.avisarAl80}
            alCambiar={(valor) => consumo({ avisarAl80: valor })}
          />
          <Interruptor
            etiqueta="Avisar al 95%"
            valor={ajustes.consumo.avisarAl95}
            alCambiar={(valor) => consumo({ avisarAl95: valor })}
          />
          <Interruptor
            etiqueta="Avisar cuando se cambie de motor"
            valor={ajustes.consumo.avisarCambioDeMotor}
            alCambiar={(valor) => consumo({ avisarCambioDeMotor: valor })}
          />
          <Interruptor
            etiqueta="También como notificación del navegador (aunque la pestaña esté en segundo plano)"
            valor={ajustes.consumo.notificacionDelNavegador}
            alCambiar={(valor) => consumo({ notificacionDelNavegador: valor })}
          />
        </fieldset>
        {error !== null && <Aviso tipo="error">{error}</Aviso>}
      </Seccion>

      <Seccion
        etiqueta="Subtítulos"
        titulo="Calidad de la traducción"
        texto="No suma demora: la traducción aparece igual de rápido. Lo que puede pasar es que una línea se corrija en pantalla cuando llega la siguiente (por ejemplo, un término que el corte partió en dos)."
      >
        <Interruptor
          etiqueta="Corregir la línea anterior cuando llega la siguiente, con más contexto."
          valor={ajustes.subtitulos.corregirLineaAnterior}
          alCambiar={(valor) =>
            void guardar({ ...ajustes, subtitulos: { corregirLineaAnterior: valor } })
          }
        />
      </Seccion>
    </>
  );
}
