import { useEffect, useState } from "react";
import type { Nivel, Recomendacion } from "@navegador/modulos/evaluar-equipo";
import {
  elegirVarianteWhisper,
  type VarianteWhisper,
} from "@navegador/modulos/modelos-compartidos";
import type { DondeSeTranscribe, ElegirTraductor } from "../motor/preparar-modelos";
import { BarraDeVelocidad } from "./BarraDeVelocidad";
import { EvaluacionDelEquipo } from "./EvaluacionDelEquipo";

const TRADUCTORES: { valor: ElegirTraductor; nombre: string }[] = [
  { valor: "bergamot", nombre: "Bergamot · liviano y al instante" },
  { valor: "translategemma", nombre: "TranslateGemma · más calidad (~2 a 3 GB)" },
];

const NOMBRE_DEL_TRADUCTOR: Record<ElegirTraductor, string> = {
  bergamot: "Bergamot",
  translategemma: "TranslateGemma",
};

const NOMBRE_DE_LA_VARIANTE: Record<VarianteWhisper, string> = {
  fp16: "sin comprimir (16 bits)",
  q4: "comprimido (4 bits)",
};

export interface EleccionDelMotor {
  nivel: Nivel;
  traductor: ElegirTraductor;
  donde: DondeSeTranscribe;
}

const LUGARES: { valor: DondeSeTranscribe; nombre: string; ayuda: string }[] = [
  {
    valor: "local",
    nombre: "En esta computadora (placa de video)",
    ayuda:
      "Gratis y sin internet. Muestra texto provisorio mientras se habla y se ajusta con la barra de velocidad. Necesita WebGPU.",
  },
  {
    valor: "nube",
    nombre: "En la nube (Whisper en Workers AI)",
    ayuda:
      "Sin exigirle nada a la placa. Trabaja por frases de 4 a 8 s: el texto aparece cuando se cierra cada frase, sin texto en vivo. Consume la cuota de Workers AI de tu cuenta y el administrador lo activa en Ajustes → Consumo.",
  },
];

// Con qué se transcribe y se traduce: la barra de velocidad, el traductor y "Evaluar esta
// computadora", que recomienda el nivel. Arriba dice qué se va a usar (o qué se está usando), para
// no tener que adivinarlo. Whisper corre siempre en la placa de esta computadora.
export function MotorDeLaSesion({
  eleccion,
  ocupada,
  alCambiar,
}: {
  eleccion: EleccionDelMotor;
  ocupada: boolean;
  alCambiar: (eleccion: EleccionDelMotor) => void;
}) {
  const [recomendacion, setRecomendacion] = useState<Recomendacion | null>(null);
  const [variante, setVariante] = useState<VarianteWhisper | "sin-webgpu" | null>(null);

  useEffect(() => {
    void elegirVarianteWhisper().then((resultado) =>
      setVariante(resultado.ok ? resultado.valor : "sin-webgpu"),
    );
  }, []);

  const margenParaGemma = recomendacion?.margenParaGemma ?? null;

  return (
    <fieldset className="flex flex-col gap-4 border-t border-ink/15 pt-4 md:col-span-2">
      <legend className="sr-only">Motor de transcripción y traducción</legend>
      <p className="font-mono text-xs text-ink/80">
        <span className="font-bold">{ocupada ? "En uso: " : "Se va a usar: "}</span>
        {eleccion.donde === "nube"
          ? "Whisper turbo en Workers AI, por frases de 4 a 8 s"
          : `Whisper en la placa de esta computadora${
              variante === null
                ? ""
                : variante === "sin-webgpu"
                  ? " (¡este navegador no tiene WebGPU!)"
                  : `, ${NOMBRE_DE_LA_VARIANTE[variante]}`
            }`}
        {" · "}
        {NOMBRE_DEL_TRADUCTOR[eleccion.traductor]} para traducir.
        {eleccion.donde === "local" && " La versión de Whisper la elige la placa sola."}
      </p>

      <EvaluacionDelEquipo
        deshabilitada={ocupada}
        nivelActual={eleccion.nivel}
        alEvaluar={(nueva) => {
          setRecomendacion(nueva);
          if (nueva.usarNube) alCambiar({ ...eleccion, donde: "nube", traductor: "bergamot" });
          else if (nueva.version !== null) alCambiar({ ...eleccion, nivel: nueva.nivel });
        }}
        alAplicar={(nivel) => alCambiar({ ...eleccion, nivel })}
      />

      <fieldset className="flex flex-col gap-1.5" disabled={ocupada}>
        <legend className="font-mono text-[10px] font-bold tracking-widest text-ink/60 uppercase">
          Dónde se transcribe
        </legend>
        <div className="flex flex-col gap-1.5 pt-2 font-mono text-sm">
          {LUGARES.map(({ valor, nombre }) => (
            <label key={valor} className="flex items-center gap-2">
              <input
                type="radio"
                checked={eleccion.donde === valor}
                onChange={() =>
                  alCambiar({
                    ...eleccion,
                    donde: valor,
                    // TranslateGemma pide la placa: en la nube se traduce con Bergamot.
                    traductor: valor === "nube" ? "bergamot" : eleccion.traductor,
                  })
                }
                className="accent-naranja"
              />
              {nombre}
            </label>
          ))}
        </div>
        <p className="font-mono text-[11px] text-ink/60">
          {LUGARES.find((lugar) => lugar.valor === eleccion.donde)?.ayuda}
        </p>
      </fieldset>

      {eleccion.donde === "local" && (
        <BarraDeVelocidad
          nivel={eleccion.nivel}
          recomendado={recomendacion?.version ? recomendacion.nivel : null}
          deshabilitada={ocupada}
          alCambiar={(nivel) => alCambiar({ ...eleccion, nivel })}
        />
      )}

      <fieldset className="flex flex-col gap-1.5" disabled={ocupada}>
        <legend className="font-mono text-[10px] font-bold tracking-widest text-ink/60 uppercase">
          Traductor
        </legend>
        <div className="flex flex-col gap-1.5 pt-2 font-mono text-sm">
          {TRADUCTORES.map(({ valor, nombre }) => (
            <label key={valor} className="flex items-center gap-2">
              <input
                type="radio"
                checked={eleccion.traductor === valor}
                disabled={valor === "translategemma" && eleccion.donde === "nube"}
                onChange={() => alCambiar({ ...eleccion, traductor: valor })}
                className="accent-naranja"
              />
              {nombre}
            </label>
          ))}
        </div>
        {eleccion.traductor === "translategemma" && (
          <p className="font-mono text-[11px] text-ink/60">
            Traduce mejor (números, modismos), pero baja un modelo de 2 a 3 GB y necesita una placa
            con margen.
          </p>
        )}
        {eleccion.traductor === "translategemma" && margenParaGemma === false && (
          <p className="font-mono text-[11px] text-naranja">
            Esta placa no tiene el margen recomendado para TranslateGemma: si los subtítulos se
            atrasan, volvé a Bergamot.
          </p>
        )}
      </fieldset>
    </fieldset>
  );
}
