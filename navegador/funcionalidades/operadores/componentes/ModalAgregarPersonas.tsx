import { useState } from "react";
import {
  MAXIMO_DE_PERSONAS_POR_PEDIDO,
  type DatosDeOperador,
  type OperadorConCodigo,
  type Sala,
} from "@compartido/contratos";
import { Modal, PieDeModal, useEnvio } from "@navegador/interfaz/sistema-diseno";
import { DesplegableDeSalas } from "./DesplegableDeSalas";

const PERSONAS_POR_PAGINA = 10;

const separar = (texto: string) =>
  texto
    .split("\n")
    .map((nombre) => nombre.trim())
    .filter((nombre) => nombre !== "");

const botonDePagina =
  "font-mono text-xs font-bold tracking-widest text-ink/50 uppercase transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30";

// "Agregar personas": se pegan o importan los nombres (uno por renglón), se les asignan salas
// —opcional, también se puede después— y se generan los códigos. Al terminar entrega los códigos
// creados para que se muestren.
export function ModalAgregarPersonas({
  salas,
  alInvitar,
  alTerminar,
  alCerrar,
}: {
  salas: readonly Sala[];
  alInvitar: (
    personas: DatosDeOperador[],
  ) => Promise<{ motivo: string } | { creados: OperadorConCodigo[] }>;
  alTerminar: (creados: OperadorConCodigo[]) => void;
  alCerrar: () => void;
}) {
  const [texto, setTexto] = useState("");
  // Las salas y los nombres corregidos se guardan por posición: al agregar renglones se conservan.
  const [salasElegidas, setSalasElegidas] = useState<string[][]>([]);
  const [nombresEditados, setNombresEditados] = useState<Record<number, string>>({});
  const [pagina, setPagina] = useState(0);
  const { error, enviando, enviar } = useEnvio();

  const personas = separar(texto).map((nombre, indice) => ({
    nombre: nombresEditados[indice] ?? nombre,
    salaIds: salasElegidas[indice] ?? [],
  }));
  const totalDePaginas = Math.max(1, Math.ceil(personas.length / PERSONAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalDePaginas - 1);
  const inicio = paginaActual * PERSONAS_POR_PAGINA;

  const importar = (archivo: File | undefined) => {
    if (!archivo) return;
    void archivo.text().then((contenido) => {
      const importados = separar(contenido.replace(/,/g, "\n"));
      if (importados.length > 0) setTexto([...separar(texto), ...importados].join("\n"));
    });
  };

  const generar = () =>
    enviar(async () => {
      const respuesta = await alInvitar(
        personas
          .filter((persona) => persona.nombre.trim() !== "")
          .map((persona) => ({ nombre: persona.nombre.trim(), salaIds: persona.salaIds })),
      );
      if ("motivo" in respuesta) return respuesta.motivo;
      alTerminar(respuesta.creados);
      return null;
    });

  return (
    <Modal
      etiqueta="Agregar personas"
      color="verde"
      ancho={760}
      titulo={
        <>
          Sumá a tu
          <br />
          equipo
        </>
      }
      alCerrar={alCerrar}
    >
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor="nombres-del-equipo"
          className="block font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase"
        >
          Nombres
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] font-bold tracking-widest text-verde uppercase hover:underline">
          ↑ Importar (.txt / .csv)
          <input
            type="file"
            accept=".txt,.csv"
            className="hidden"
            onChange={(evento) => {
              importar(evento.target.files?.[0]);
              evento.target.value = "";
            }}
          />
        </label>
      </div>
      <textarea
        id="nombres-del-equipo"
        value={texto}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setNombresEditados({});
        }}
        placeholder={
          "Un nombre por línea, por ejemplo:\nMartina Suárez\nEzequiel Paredes\nCarolina Núñez\nIgnacio Vega"
        }
        className="mb-2 h-[140px] w-full resize-none overflow-y-auto border-[1.5px] border-[#443d30] bg-canvas px-4 py-3 font-mono text-sm text-ink transition-colors outline-none placeholder:text-ink/30 focus:border-verde"
      />
      <p className="mb-6 text-xs text-ink/50">
        Podés pegar varios nombres de una, uno por línea, o importar un archivo con la lista (hasta{" "}
        {MAXIMO_DE_PERSONAS_POR_PEDIDO}). Entran con un código, no con email — se lo compartís vos
        por el canal que uses con tu equipo.
      </p>

      {personas.length > 0 && (
        <div className="mb-2">
          <div className="mb-3 flex items-center justify-between">
            <span className="block font-mono text-[11px] font-bold tracking-widest text-ink/70 uppercase">
              Personas a agregar
            </span>
            <span className="font-mono text-[11px] text-ink/50">
              {personas.length} {personas.length === 1 ? "persona" : "personas"} en total
            </span>
          </div>
          <div className="mb-4 flex flex-col gap-2.5">
            {personas.slice(inicio, inicio + PERSONAS_POR_PAGINA).map((persona, desplazamiento) => {
              const indice = inicio + desplazamiento;
              return (
                <div key={indice} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 font-mono text-[11px] text-ink/40">
                    {indice + 1}
                  </span>
                  <input
                    type="text"
                    value={persona.nombre}
                    aria-label={`Nombre de la persona ${String(indice + 1)}`}
                    onChange={(evento) =>
                      setNombresEditados((actuales) => ({
                        ...actuales,
                        [indice]: evento.target.value,
                      }))
                    }
                    className="flex-1 border-[1.5px] border-[#443d30] bg-canvas px-3 py-2 font-mono text-sm text-ink transition-colors outline-none focus:border-verde"
                  />
                  <DesplegableDeSalas
                    variante="campo"
                    salas={salas}
                    elegidas={persona.salaIds}
                    alCambiar={(elegidas) =>
                      setSalasElegidas((actuales) => {
                        const copia = [...actuales];
                        copia[indice] = elegidas;
                        return copia;
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              disabled={paginaActual === 0}
              onClick={() => setPagina(paginaActual - 1)}
              className={botonDePagina}
            >
              ← Anterior
            </button>
            <span className="font-mono text-xs text-ink/50">
              Página {paginaActual + 1} de {totalDePaginas}
            </span>
            <button
              type="button"
              disabled={paginaActual >= totalDePaginas - 1}
              onClick={() => setPagina(paginaActual + 1)}
              className={botonDePagina}
            >
              Siguiente →
            </button>
          </div>
          <p className="-mt-2 mb-6 text-xs text-ink/50">
            Asignar salas acá es opcional — también lo podés hacer después desde la tabla de staff.
          </p>
        </div>
      )}

      <PieDeModal error={error} alCancelar={alCerrar}>
        <button
          type="button"
          disabled={enviando || personas.length === 0}
          onClick={() => void generar()}
          className="inline-flex items-center gap-2 border-[3px] border-[#2f8a70] bg-verde px-6 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors hover:bg-[#3bab8a] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-verde"
        >
          {personas.length > 1 ? `Generar ${String(personas.length)} códigos` : "Generar código"} →
        </button>
      </PieDeModal>
    </Modal>
  );
}
