import { useState } from "react";
import { MAXIMO_DE_SALAS_POR_PEDIDO, type Idioma } from "@compartido/contratos";
import { Aviso, Boton, Campo, Modal } from "@navegador/interfaz/sistema-diseno";

type Paso = "eleccion" | "una" | "cantidad" | "tabla";

const SALAS_POR_PAGINA = 10;
// Al crear una sala no se pregunta el idioma: arranca en español con inglés y portugués, y se
// cambia después desde "Editar" (o en cada charla).
const IDIOMA_ORIGINAL: Idioma = "es";
const IDIOMAS_DESTINO: Idioma[] = ["en", "pt"];

const OPCIONES = [
  { paso: "una", titulo: "1 sala", texto: "Para un solo escenario o sesión." },
  {
    paso: "cantidad",
    titulo: "Varias salas",
    texto: "Para eventos con varios escenarios a la vez.",
  },
] as const;

// "Añadir sala": una sola, o varias de una (se elige la cantidad y se les pone nombre en una
// tabla).
export function ModalAnadirSala({
  cantidadActual,
  alCrear,
  alCerrar,
}: {
  cantidadActual: number;
  // Devuelve el motivo si no se pudo (null si salió bien).
  alCrear: (
    salas: {
      nombre: string;
      idiomaOriginal: Idioma;
      idiomasDestino: Idioma[];
    }[],
  ) => Promise<string | null>;
  alCerrar: () => void;
}) {
  const [paso, setPaso] = useState<Paso>("eleccion");
  const [nombres, setNombres] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState("2");
  const [pagina, setPagina] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const nombreInicial = (indice: number) => `Sala-${String(cantidadActual + indice + 1)}`;
  const totalDePaginas = Math.max(1, Math.ceil(nombres.length / SALAS_POR_PAGINA));

  const crear = async (lista: string[]) => {
    setEnviando(true);
    setError(null);
    const motivo = await alCrear(
      lista.map((nombre, indice) => ({
        nombre: nombre.trim() || nombreInicial(indice),
        idiomaOriginal: IDIOMA_ORIGINAL,
        idiomasDestino: IDIOMAS_DESTINO,
      })),
    );
    setEnviando(false);
    if (motivo === null) alCerrar();
    else setError(motivo);
  };

  const elegir = (siguiente: "una" | "cantidad") => {
    setNombres(siguiente === "una" ? [nombreInicial(0)] : []);
    setPaso(siguiente);
  };

  const continuarConCantidad = () => {
    const total = Math.min(
      MAXIMO_DE_SALAS_POR_PEDIDO,
      Math.max(2, Math.round(Number(cantidad)) || 2),
    );
    setNombres(Array.from({ length: total }, (_, indice) => nombreInicial(indice)));
    setPagina(0);
    setPaso("tabla");
  };

  const inicio = pagina * SALAS_POR_PAGINA;
  const visibles = nombres.slice(inicio, inicio + SALAS_POR_PAGINA);

  return (
    <Modal
      etiqueta="Añadir sala"
      titulo={
        paso === "eleccion" ? (
          <>
            ¿Cuántas salas
            <br />
            vas a crear?
          </>
        ) : paso === "una" ? (
          "Nombrá tu sala"
        ) : paso === "cantidad" ? (
          "¿Cuántas?"
        ) : (
          <>
            Ponele nombre
            <br />a cada una
          </>
        )
      }
      alCerrar={alCerrar}
    >
      {paso === "eleccion" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {OPCIONES.map((opcion) => (
            <button
              key={opcion.paso}
              type="button"
              onClick={() => elegir(opcion.paso)}
              className="flex flex-col items-start gap-2 border-[1.5px] border-ink/30 p-5 text-left hover:border-ink"
            >
              <span className="font-display text-3xl leading-none uppercase">{opcion.titulo}</span>
              <span className="text-sm text-ink/70">{opcion.texto}</span>
            </button>
          ))}
        </div>
      )}

      {paso === "una" && (
        <form
          className="flex flex-col gap-5"
          onSubmit={(evento) => {
            evento.preventDefault();
            void crear(nombres);
          }}
        >
          <Campo
            etiqueta="Nombre"
            valor={nombres[0] ?? ""}
            alCambiar={(nombre) => setNombres([nombre])}
            autoComplete="off"
          />
          {error !== null && <Aviso tipo="error">{error}</Aviso>}
          <div className="flex justify-between gap-3">
            <Boton variante="secundario" onClick={() => setPaso("eleccion")}>
              ← Atrás
            </Boton>
            <Boton type="submit" disabled={enviando}>
              Crear sala →
            </Boton>
          </div>
        </form>
      )}

      {paso === "cantidad" && (
        <form
          className="flex flex-col gap-5"
          onSubmit={(evento) => {
            evento.preventDefault();
            continuarConCantidad();
          }}
        >
          <Campo
            etiqueta="Cantidad de salas"
            tipo="number"
            valor={cantidad}
            alCambiar={setCantidad}
            minimo={2}
            maximo={MAXIMO_DE_SALAS_POR_PEDIDO}
          />
          <div className="flex justify-between gap-3">
            <Boton variante="secundario" onClick={() => setPaso("eleccion")}>
              ← Atrás
            </Boton>
            <Boton type="submit">Continuar →</Boton>
          </div>
        </form>
      )}

      {paso === "tabla" && (
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs text-ink/60">
            {nombres.length} salas en total, editá los nombres que quieras.
          </p>
          <div className="flex flex-col gap-2">
            {visibles.map((nombre, indice) => (
              <div key={inicio + indice} className="flex items-center gap-3">
                <span className="w-8 shrink-0 font-mono text-[11px] text-ink/40">
                  {inicio + indice + 1}
                </span>
                <input
                  type="text"
                  value={nombre}
                  aria-label={`Nombre de la sala ${String(inicio + indice + 1)}`}
                  onChange={(evento) =>
                    setNombres((actuales) =>
                      actuales.map((actual, i) =>
                        i === inicio + indice ? evento.target.value : actual,
                      ),
                    )
                  }
                  className="flex-1 border-[1.5px] border-ink/25 bg-canvas px-3 py-2 font-mono text-sm outline-none focus:border-naranja"
                />
              </div>
            ))}
          </div>
          {totalDePaginas > 1 && (
            <div className="flex items-center justify-between font-mono text-xs">
              <button
                type="button"
                disabled={pagina === 0}
                onClick={() => setPagina(pagina - 1)}
                className="disabled:opacity-30"
              >
                ← Anterior
              </button>
              <span>
                Página {pagina + 1} de {totalDePaginas}
              </span>
              <button
                type="button"
                disabled={pagina >= totalDePaginas - 1}
                onClick={() => setPagina(pagina + 1)}
                className="disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
          )}
          {error !== null && <Aviso tipo="error">{error}</Aviso>}
          <div className="flex justify-between gap-3">
            <Boton variante="secundario" onClick={() => setPaso("cantidad")}>
              ← Atrás
            </Boton>
            <Boton disabled={enviando} onClick={() => void crear(nombres)}>
              Crear {nombres.length} salas →
            </Boton>
          </div>
        </div>
      )}
    </Modal>
  );
}
