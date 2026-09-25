import {
  IDIOMAS,
  NOMBRES_DE_IDIOMA,
  esquemaIdioma,
  validar,
  type Idioma,
} from "@compartido/contratos";
import { Seleccion } from "@navegador/interfaz/sistema-diseno";

export interface IdiomasDeSala {
  original: Idioma;
  destino: Idioma[];
}

const etiqueta = "font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase";

// El idioma que se habla en la sala y los idiomas a los que se traduce (uno, los dos o ninguno).
export function SelectorDeIdiomas({
  valor,
  alCambiar,
}: {
  valor: IdiomasDeSala;
  alCambiar: (valor: IdiomasDeSala) => void;
}) {
  const cambiarOriginal = (texto: string) => {
    const idioma = validar(esquemaIdioma, texto);
    if (!idioma.ok) return;
    alCambiar({
      original: idioma.valor,
      destino: valor.destino.filter((destino) => destino !== idioma.valor),
    });
  };
  const alternar = (idioma: Idioma) =>
    alCambiar({
      ...valor,
      destino: valor.destino.includes(idioma)
        ? valor.destino.filter((destino) => destino !== idioma)
        : [...valor.destino, idioma],
    });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Seleccion
        etiqueta="Idioma que se habla"
        valor={valor.original}
        alCambiar={cambiarOriginal}
        opciones={IDIOMAS.map((idioma) => ({ valor: idioma, texto: NOMBRES_DE_IDIOMA[idioma] }))}
      />
      <fieldset className="flex flex-col gap-1.5">
        <legend className={etiqueta}>Traducir a</legend>
        <div className="flex gap-4 pt-3 font-mono text-sm">
          {IDIOMAS.filter((idioma) => idioma !== valor.original).map((idioma) => (
            <label key={idioma} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={valor.destino.includes(idioma)}
                onChange={() => alternar(idioma)}
                className="accent-naranja"
              />
              {NOMBRES_DE_IDIOMA[idioma]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
