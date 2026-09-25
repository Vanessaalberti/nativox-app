import {
  NOMBRES_DE_IDIOMA,
  esquemaIdioma,
  validar,
  type EstiloSalida,
  type Idioma,
} from "@compartido/contratos";

const etiqueta = "font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase";

// Los controles del estilo de subtítulos (idioma, líneas, posición, original y tamaño de letra):
// los usan el link de cada sala y cada salida de producción.
export function EditorDeEstilo({
  estilo,
  idiomas,
  alCambiar,
}: {
  estilo: EstiloSalida;
  // Los idiomas que la sala puede mostrar (el original y los de destino).
  idiomas: readonly Idioma[];
  alCambiar: (estilo: EstiloSalida) => void;
}) {
  const cambiar = (parcial: Partial<EstiloSalida>) => alCambiar({ ...estilo, ...parcial });

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className={etiqueta}>Idioma</span>
        <select
          value={estilo.idioma}
          onChange={(evento) => {
            const idioma = validar(esquemaIdioma, evento.target.value);
            if (idioma.ok) cambiar({ idioma: idioma.valor });
          }}
          className="w-full border-[1.5px] border-ink/25 bg-canvas px-3 py-3 font-mono text-sm outline-none focus:border-naranja"
        >
          {idiomas.map((idioma) => (
            <option key={idioma} value={idioma}>
              {NOMBRES_DE_IDIOMA[idioma]}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="flex flex-col gap-1.5">
        <legend className={etiqueta}>Líneas</legend>
        <div className="flex gap-2 pt-1">
          {([1, 2, 3] as const).map((cantidad) => (
            <button
              key={cantidad}
              type="button"
              aria-pressed={estilo.lineas === cantidad}
              onClick={() => cambiar({ lineas: cantidad })}
              className={`w-12 py-2 font-mono text-sm ${estilo.lineas === cantidad ? "border-[3px] border-[#b8241f] bg-naranja" : "border-[1.5px] border-ink/30 hover:border-ink"}`}
            >
              {cantidad}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-1.5">
        <legend className={etiqueta}>Posición</legend>
        <div className="flex gap-2 pt-1">
          {(["abajo", "arriba"] as const).map((posicion) => (
            <button
              key={posicion}
              type="button"
              aria-pressed={estilo.posicion === posicion}
              onClick={() => cambiar({ posicion })}
              className={`px-4 py-2 font-mono text-sm capitalize ${estilo.posicion === posicion ? "border-[3px] border-[#b8241f] bg-naranja" : "border-[1.5px] border-ink/30 hover:border-ink"}`}
            >
              {posicion}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className={etiqueta}>Tamaño de la letra ({estilo.tamanoLetra} px sobre 1920)</span>
        <input
          type="range"
          min={24}
          max={120}
          step={2}
          value={estilo.tamanoLetra}
          onChange={(evento) => cambiar({ tamanoLetra: Number(evento.target.value) })}
          className="accent-naranja"
        />
      </label>
      <label className="flex items-center gap-2 font-mono text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={estilo.mostrarOriginal}
          onChange={(evento) => cambiar({ mostrarOriginal: evento.target.checked })}
          className="accent-naranja"
        />
        Mostrar también el original
      </label>
    </div>
  );
}
