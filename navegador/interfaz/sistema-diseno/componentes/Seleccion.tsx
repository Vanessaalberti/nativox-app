const ETIQUETA = "font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase";

// Etiqueta + lista desplegable.
export function Seleccion({
  etiqueta,
  valor,
  alCambiar,
  opciones,
}: {
  etiqueta: string;
  valor: string | number;
  alCambiar: (valor: string) => void;
  opciones: readonly { valor: string | number; texto: string }[];
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={ETIQUETA}>{etiqueta}</span>
      <select
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="w-full border-[1.5px] border-[#443d30] bg-canvas px-4 py-3 font-mono text-sm outline-none focus:border-naranja"
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
    </label>
  );
}
