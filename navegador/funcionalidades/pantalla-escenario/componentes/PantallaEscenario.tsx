import { useRef, useState } from "react";
import { esquemaIdioma, validar, type Idioma, type Linea } from "@compartido/contratos";
import { VistaSubtitulos, type TamanoSubtitulo } from "@navegador/interfaz/subtitulos";
import { useControlesQueSeEsconden } from "../hooks/useControlesQueSeEsconden";
import { usePantallaCompleta } from "../hooks/usePantallaCompleta";

const NOMBRES: Record<Idioma, string> = { es: "Español", en: "English", pt: "Português" };
const TAMANOS: TamanoSubtitulo[] = ["S", "M", "L"];

export interface PropiedadesPantallaEscenario {
  lineas: readonly Linea[];
  idiomaOriginal: Idioma;
  idiomasDestino: readonly Idioma[];
  enVivo: boolean;
  // Sin esto la pantalla vive en su propia pestaña: no hay "Salir" y la pantalla completa se pide
  // con un botón.
  alSalir?: () => void;
  // Cómo abre: el idioma, si muestra el original y el tamaño (lo que trae el link).
  inicial?: { idioma?: Idioma; mostrarOriginal?: boolean; tamano?: TamanoSubtitulo };
}

// Las pantallas frente al escenario muestran este mismo navegador: los subtítulos salen directo
// del flujo de la pestaña, sin pasar por internet, y la captura sigue mientras se ven.
export function PantallaEscenario({
  lineas,
  idiomaOriginal,
  idiomasDestino,
  enVivo,
  alSalir,
  inicial,
}: PropiedadesPantallaEscenario) {
  const contenedor = useRef<HTMLDivElement>(null);
  const { visibles, mostrar } = useControlesQueSeEsconden();
  usePantallaCompleta(contenedor, alSalir);
  const [idioma, setIdioma] = useState<Idioma>(
    inicial?.idioma ?? idiomasDestino[0] ?? idiomaOriginal,
  );
  const [mostrarOriginal, setMostrarOriginal] = useState(inicial?.mostrarOriginal ?? true);
  const [tamano, setTamano] = useState<TamanoSubtitulo>(inicial?.tamano ?? "M");
  const idiomas = [idiomaOriginal, ...idiomasDestino];

  return (
    <div
      ref={contenedor}
      onMouseMove={mostrar}
      className={`fixed inset-0 z-50 flex flex-col bg-escenario ${visibles ? "" : "cursor-none"}`}
    >
      <div
        className={`flex flex-wrap items-center gap-4 bg-black/60 px-6 py-4 font-mono text-xs text-canvas transition-opacity duration-500 ${visibles ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <label className="flex items-center gap-2 uppercase tracking-widest">
          Idioma
          <select
            value={idioma}
            onChange={(evento) => {
              const elegido = validar(esquemaIdioma, evento.target.value);
              if (elegido.ok) setIdioma(elegido.valor);
            }}
            className="rounded-sm border border-canvas/30 bg-transparent px-2 py-1.5"
          >
            {idiomas.map((opcion) => (
              <option key={opcion} value={opcion} className="bg-menu">
                {NOMBRES[opcion]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 uppercase tracking-widest">
          <input
            type="checkbox"
            checked={mostrarOriginal}
            onChange={(evento) => setMostrarOriginal(evento.target.checked)}
            className="accent-verde"
          />
          Mostrar el original
        </label>
        <div className="flex items-center gap-1" role="group" aria-label="Tamaño de los subtítulos">
          {TAMANOS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setTamano(opcion)}
              aria-pressed={tamano === opcion}
              className={`rounded-sm border px-2.5 py-1 font-bold ${tamano === opcion ? "border-naranja bg-naranja text-ink" : "border-canvas/30"}`}
            >
              {opcion}
            </button>
          ))}
        </div>
        {alSalir ? (
          <button
            type="button"
            onClick={alSalir}
            className="ml-auto font-bold tracking-widest text-canvas/70 uppercase hover:text-canvas"
          >
            ✕ Salir (Esc)
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void contenedor.current?.requestFullscreen().catch(() => undefined)}
            className="ml-auto font-bold tracking-widest text-canvas/70 uppercase hover:text-canvas"
          >
            ⛶ Pantalla completa
          </button>
        )}
      </div>
      <div className="flex flex-1 items-end justify-center px-[6vw] pb-[8vh]">
        <VistaSubtitulos
          lineas={lineas}
          idioma={idioma}
          idiomaOriginal={idiomaOriginal}
          mostrarOriginal={mostrarOriginal}
          tamano={tamano}
          cantidad={2}
          textoVacio="Los subtítulos aparecen acá cuando empieza la charla."
        />
      </div>
      {enVivo && (
        <span className="absolute bottom-4 right-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-canvas/40">
          <span className="size-2 animate-titilar rounded-full bg-red-500" /> Capturando
        </span>
      )}
    </div>
  );
}
