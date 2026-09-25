import type { ReactNode } from "react";

// Una casilla con su explicación: para las preferencias que se prenden o se apagan.
export function Interruptor({
  etiqueta,
  ayuda,
  valor,
  alCambiar,
  deshabilitado = false,
}: {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  valor: boolean;
  alCambiar: (valor: boolean) => void;
  deshabilitado?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 text-sm ${deshabilitado ? "opacity-50" : ""}`}>
      <input
        type="checkbox"
        checked={valor}
        disabled={deshabilitado}
        onChange={(evento) => alCambiar(evento.target.checked)}
        className="mt-1 accent-naranja"
      />
      <span>
        {etiqueta}
        {ayuda !== undefined && (
          <span className="mt-1 block font-mono text-[11px] leading-relaxed text-ink/60">
            {ayuda}
          </span>
        )}
      </span>
    </label>
  );
}
