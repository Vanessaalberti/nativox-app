import { useState } from "react";
import { NOMBRES_DE_IDIOMA, type Idioma } from "@compartido/contratos";
import { CajaCopiable } from "@navegador/interfaz/sistema-diseno";

const TAMANOS = ["S", "M", "L"] as const;
type Tamano = (typeof TAMANOS)[number];

const etiqueta = "font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60";

// El link de la pantalla del escenario: se pega en el navegador de las pantallas de la sala y
// funciona solo, sin sesión. Trae el idioma, el tamaño y si muestra el original, así cada pantalla
// (o cada lado del escenario) puede mostrar lo suyo con su propio link.
export function EnlaceDeEscenario({
  salaId,
  idiomas,
}: {
  salaId: string;
  idiomas: readonly Idioma[];
}) {
  const [idioma, setIdioma] = useState<Idioma | undefined>(idiomas[1] ?? idiomas[0]);
  const [tamano, setTamano] = useState<Tamano>("M");
  const [original, setOriginal] = useState(true);

  const parametros = new URLSearchParams({ tamano, original: original ? "1" : "0" });
  if (idioma) parametros.set("idioma", idioma);
  const enlace = `${window.location.origin}/sala/${salaId}/escenario?${parametros.toString()}`;

  return (
    <details className="border-[1.5px] border-ink/15 bg-canvas p-4">
      <summary className="cursor-pointer font-mono text-[11px] font-bold tracking-widest uppercase">
        Link de la pantalla del escenario (para las pantallas de la sala)
      </summary>
      <div className="mt-4 flex flex-col gap-4">
        <p className="font-mono text-[11px] text-ink/60">
          Pegalo en el navegador de cada pantalla: abre los subtítulos a pantalla completa, se
          conecta solo a esta sala y sigue solo. No pide sesión.
        </p>
        <div className="flex flex-wrap items-end gap-5">
          <label className="flex flex-col gap-1.5">
            <span className={etiqueta}>Idioma</span>
            <select
              value={idioma}
              onChange={(evento) =>
                setIdioma(idiomas.find((opcion) => opcion === evento.target.value))
              }
              className="border-[1.5px] border-ink/25 bg-canvas px-3 py-2 font-mono text-sm"
            >
              {idiomas.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {NOMBRES_DE_IDIOMA[opcion]}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="flex flex-col gap-1.5">
            <legend className={etiqueta}>Tamaño</legend>
            <div className="flex gap-1.5 pt-1">
              {TAMANOS.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  aria-pressed={tamano === opcion}
                  onClick={() => setTamano(opcion)}
                  className={`w-10 py-1.5 font-mono text-sm ${tamano === opcion ? "border-[3px] border-[#b8241f] bg-naranja" : "border-[1.5px] border-ink/30 hover:border-ink"}`}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 pb-2 font-mono text-sm">
            <input
              type="checkbox"
              checked={original}
              onChange={(evento) => setOriginal(evento.target.checked)}
              className="accent-naranja"
            />
            Mostrar el original
          </label>
        </div>
        <CajaCopiable valor={enlace} />
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start font-mono text-[11px] font-bold tracking-widest uppercase underline hover:text-naranja"
        >
          Abrir en otra pestaña ↗
        </a>
      </div>
    </details>
  );
}
