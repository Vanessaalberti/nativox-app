import type { Medicion } from "@navegador/modulos/flujo-subtitulos";
import type { VarianteWhisper } from "@navegador/modulos/modelos-compartidos";

export interface PropiedadesMediciones {
  mediciones: readonly Medicion[];
  variante: VarianteWhisper | null;
}

const promedio = (valores: readonly number[]) =>
  valores.length === 0 ? null : valores.reduce((a, b) => a + b, 0) / valores.length;

const segundos = (valor: number | null) => (valor === null ? "—" : `${valor.toFixed(1)} s`);
const milisegundos = (valor: number | null) =>
  valor === null ? "—" : `${String(Math.round(valor))} ms`;

// Lo que pide el plan medir: el retraso de lo dicho al subtítulo y lo que tarda cada pasada.
export function Mediciones({ mediciones, variante }: PropiedadesMediciones) {
  const ultima = mediciones.at(-1) ?? null;
  const filas: [string, string, string][] = [
    [
      "Frase dicha → confirmada",
      segundos(ultima?.retrasoConfirmacionSegundos ?? null),
      segundos(promedio(mediciones.map((m) => m.retrasoConfirmacionSegundos))),
    ],
    [
      "Frase dicha → traducida",
      segundos(ultima?.retrasoTraduccionSegundos ?? null),
      segundos(promedio(mediciones.map((m) => m.retrasoTraduccionSegundos))),
    ],
    [
      "Pasada de Whisper",
      milisegundos(ultima?.transcripcionMs ?? null),
      milisegundos(promedio(mediciones.map((m) => m.transcripcionMs))),
    ],
    [
      "Traducción (todos los idiomas)",
      milisegundos(ultima?.traduccionMs ?? null),
      milisegundos(promedio(mediciones.map((m) => m.traduccionMs))),
    ],
  ];

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-ink/50">
            <th className="py-1 font-bold">Medición</th>
            <th className="py-1 text-right font-bold">Última</th>
            <th className="py-1 text-right font-bold">Promedio ({mediciones.length})</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(([nombre, ultimaMedida, promedioMedido]) => (
            <tr key={nombre} className="border-t border-linea">
              <td className="py-1.5">{nombre}</td>
              <td className="py-1.5 text-right">{ultimaMedida}</td>
              <td className="py-1.5 text-right">{promedioMedido}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
        Whisper large-v3 turbo ·{" "}
        {variante === "fp16"
          ? "sin comprimir (fp16)"
          : variante === "q4"
            ? "comprimido (q4)"
            : "sin cargar"}{" "}
        · Bergamot
      </p>
    </div>
  );
}
