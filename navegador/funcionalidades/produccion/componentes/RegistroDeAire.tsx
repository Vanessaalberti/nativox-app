import { useEffect, useState } from "react";
import type { EntradaDeAire } from "@compartido/contratos";
import { leerRegistroDeAire } from "@navegador/modulos/cliente-instancia";

const hora = (milisegundos: number) =>
  new Date(milisegundos).toLocaleString("es", { dateStyle: "short", timeStyle: "medium" });

// Qué sala estuvo al aire en cada salida y desde cuándo (lo último arriba). Se vuelve a pedir cada
// vez que cambia lo que está al aire (`version`).
export function RegistroDeAire({
  version,
  nombresDeSalidas,
}: {
  version: string;
  nombresDeSalidas: ReadonlyMap<number, string>;
}) {
  const [entradas, setEntradas] = useState<EntradaDeAire[] | null>(null);

  useEffect(() => {
    void leerRegistroDeAire().then((respuesta) => setEntradas(respuesta.ok ? respuesta.valor : []));
  }, [version]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
        Qué estuvo al aire
      </h2>
      {entradas === null ? (
        <p className="font-mono text-xs text-ink/60">Cargando…</p>
      ) : entradas.length === 0 ? (
        <p className="font-mono text-xs text-ink/60">
          Todavía no cambiaste ninguna sala al aire: cada cambio queda anotado acá.
        </p>
      ) : (
        <ol className="flex max-h-[240px] flex-col gap-1.5 overflow-y-auto font-mono text-xs">
          {entradas.map((entrada, indice) => (
            <li key={`${String(entrada.desde)}-${String(indice)}`} className="flex gap-3">
              <span className="text-ink/50">{hora(entrada.desde)}</span>
              <span>
                {nombresDeSalidas.get(entrada.salida) ?? `Salida ${String(entrada.salida)}`} →{" "}
                <strong>{entrada.sala ?? "sin subtítulos"}</strong>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
