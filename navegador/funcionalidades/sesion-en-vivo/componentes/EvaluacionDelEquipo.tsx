import {
  NOMBRES_DE_NIVEL,
  explicarMotivo,
  segundos,
  useEvaluacion,
  type Nivel,
  type Recomendacion,
} from "@navegador/modulos/evaluar-equipo";

// "Evaluar esta computadora" desde la sesión en vivo: revisa la placa y mide su potencia (unos
// segundos, sin descargar nada), y dice con qué conviene transcribir. `alEvaluar` entrega la
// recomendación para que la pantalla marque el nivel recomendado.
export function EvaluacionDelEquipo({
  deshabilitada,
  nivelActual,
  alEvaluar,
  alAplicar,
}: {
  deshabilitada: boolean;
  nivelActual: Nivel;
  alEvaluar: (recomendacion: Recomendacion) => void;
  alAplicar: (nivel: Nivel) => void;
}) {
  const { estado, evaluar } = useEvaluacion();
  const evaluando = estado.fase === "evaluando";
  const lista = estado.fase === "lista" ? estado.evaluacion : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={deshabilitada || evaluando}
          onClick={() => {
            void evaluar().then((evaluacion) => {
              if (evaluacion) alEvaluar(evaluacion.recomendacion);
            });
          }}
          className="border-[1.5px] border-ink px-4 py-2 font-mono text-[11px] font-bold tracking-widest uppercase hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:opacity-40"
        >
          {evaluando ? "Evaluando…" : lista ? "Volver a evaluar" : "Evaluar esta computadora"}
        </button>
        <span className="font-mono text-[11px] text-ink/55">
          Revisa la placa y mide su potencia. No descarga nada.
        </span>
      </div>
      {estado.fase === "error" && (
        <p role="alert" className="font-mono text-xs text-[#b8241f]">
          No pudimos evaluar: {estado.motivo}
        </p>
      )}
      {lista && (
        <div className="border-[1.5px] border-verde bg-verde/10 p-3 text-xs">
          <p className="font-mono text-[10px] font-bold tracking-widest uppercase">
            Recomendado para esta computadora
          </p>
          <p className="mt-1 font-bold">
            {lista.equipo.placa ?? "Placa sin nombre"}
            {lista.medidas
              ? ` · una pasada de Whisper ≈ ${segundos(lista.medidas.pasadaEstimadaMs)}`
              : ""}
          </p>
          {lista.recomendacion.version === null ? (
            <p className="mt-1 font-bold">No puede correr Whisper en vivo por sí sola.</p>
          ) : (
            <p className="mt-1 font-bold">
              Nivel {lista.recomendacion.nivel} · {NOMBRES_DE_NIVEL[lista.recomendacion.nivel]} ·
              Whisper{" "}
              {lista.recomendacion.version === "fp16"
                ? "sin comprimir (16 bits)"
                : "comprimido (4 bits)"}
            </p>
          )}
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-ink/80">
            {lista.recomendacion.motivos.map((motivo) => (
              <li key={motivo.codigo}>{explicarMotivo(motivo)}</li>
            ))}
          </ul>
          {lista.recomendacion.usarNube && (
            <p className="mt-2 font-bold text-naranja">
              Para esta computadora conviene la transcripción en la nube (Ajustes → Consumo).
            </p>
          )}
          {lista.recomendacion.version !== null && lista.recomendacion.nivel !== nivelActual && (
            <button
              type="button"
              disabled={deshabilitada}
              onClick={() => alAplicar(lista.recomendacion.nivel)}
              className="mt-2 font-mono text-[11px] font-bold tracking-widest text-naranja uppercase hover:underline disabled:opacity-40"
            >
              Usar el nivel recomendado →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
