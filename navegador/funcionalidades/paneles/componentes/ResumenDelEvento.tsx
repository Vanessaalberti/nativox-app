import { useCallback, useEffect, useState } from "react";
import type { EventoCompleto, Operador, Sala, SalaPublica } from "@compartido/contratos";
import { leerAudiencia, listarOperadores, listarSalas } from "@navegador/modulos/cliente-instancia";
import { Link } from "react-router";
import { useAlMostrarse } from "@navegador/interfaz/sistema-diseno";

const CADA_CUANTO_SE_ACTUALIZA_MS = 10_000;

const cabecera =
  "px-5 py-3 text-left font-mono text-[10px] font-bold tracking-widest uppercase text-ink/50";

interface Datos {
  salas: Sala[];
  operadores: Operador[];
  enVivo: ReadonlySet<string>;
}

async function pedirDatos(conEquipo: boolean): Promise<Datos | null> {
  const [salas, operadores, audiencia] = await Promise.all([
    listarSalas(),
    conEquipo ? listarOperadores() : Promise.resolve({ ok: true as const, valor: [] }),
    leerAudiencia(),
  ]);
  if (!salas.ok || !operadores.ok) return null;
  const publicas: SalaPublica[] = audiencia.ok ? audiencia.valor.salas : [];
  return {
    salas: salas.valor,
    operadores: operadores.valor,
    enVivo: new Set(publicas.filter((sala) => sala.enVivo).map((sala) => sala.id)),
  };
}

function Tarjeta({ nombre, valor, acento }: { nombre: string; valor: number; acento?: string }) {
  return (
    <div className="border-[1.5px] border-[#443d30] bg-canvas p-5">
      <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">{nombre}</span>
      <p className={`mt-2 font-display text-4xl leading-none ${acento ?? ""}`}>{valor}</p>
    </div>
  );
}

// La pestaña "Dashboard": cómo le está yendo al evento de un vistazo — cuántas salas hay, cuánta
// gente en el staff, cuáles están en vivo y cuáles no tienen a nadie asignado — y el estado de
// cada sala.
export function ResumenDelEvento({
  evento,
  visible,
  alAbrirSalas,
}: {
  evento: EventoCompleto;
  visible: boolean;
  alAbrirSalas: () => void;
}) {
  const conEquipo = evento.tipo === "roles-separados";
  const [datos, setDatos] = useState<Datos | null>(null);

  const actualizar = useCallback(() => {
    void pedirDatos(conEquipo).then((nuevos) => {
      if (nuevos) setDatos(nuevos);
    });
  }, [conEquipo]);

  useEffect(() => {
    actualizar();
    const intervalo = setInterval(actualizar, CADA_CUANTO_SE_ACTUALIZA_MS);
    return () => clearInterval(intervalo);
  }, [actualizar]);
  useAlMostrarse(visible, actualizar);

  const salas = datos?.salas ?? [];
  const operadoresDe = (sala: Sala) =>
    datos?.operadores.filter((operador) => operador.salaIds.includes(sala.id)).length ?? 0;
  const sinAsignar = salas.filter((sala) => operadoresDe(sala) === 0).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-6 shrink-0 text-sm text-ink/60">
        Cómo le está yendo a tu organización, de un vistazo.
      </p>

      <div
        className={`mb-10 grid shrink-0 grid-cols-2 gap-4 ${conEquipo ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
      >
        <Tarjeta nombre="Salas totales" valor={salas.length} />
        {conEquipo && <Tarjeta nombre="Staff total" valor={datos?.operadores.length ?? 0} />}
        <Tarjeta nombre="Salas en vivo" valor={datos?.enVivo.size ?? 0} acento="text-verde" />
        {conEquipo && <Tarjeta nombre="Sin asignar" valor={sinAsignar} acento="text-naranja" />}
      </div>

      {datos !== null && salas.length === 0 && (
        <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center border-[1.5px] border-dashed border-[#443d30]/60 px-8 py-16 text-center">
          <p className="max-w-[440px] text-base text-ink/70">
            Todavía no hay salas para mostrar acá. Creá la primera en la pestaña{" "}
            <button type="button" onClick={alAbrirSalas} className="text-naranja hover:underline">
              Salas
            </button>
            .
          </p>
        </div>
      )}

      {salas.length > 0 && (
        <div className="flex-1 overflow-y-auto border-[1.5px] border-[#443d30] bg-canvas">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#443d30]/30">
                <th className={cabecera}>Sala</th>
                {conEquipo && <th className={cabecera}>Operadores</th>}
                <th className={cabecera}>Estado</th>
                <th className={`${cabecera} text-right`}>Monitoreo</th>
              </tr>
            </thead>
            <tbody>
              {salas.map((sala) => (
                <tr key={sala.id} className="border-b border-[#443d30]/15 last:border-0">
                  <td className="px-5 py-3.5 font-mono text-sm">{sala.nombre}</td>
                  {conEquipo && (
                    <td className="px-5 py-3.5 text-sm text-ink/70">{operadoresDe(sala)}</td>
                  )}
                  <td className="px-5 py-3.5">
                    {datos?.enVivo.has(sala.id) ? (
                      <span className="bg-verde/25 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase">
                        ● En vivo
                      </span>
                    ) : (
                      <span className="bg-ink/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-ink/50 uppercase">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/sala/${sala.id}/monitoreo`}
                      className="font-mono text-[11px] font-bold tracking-widest text-naranja uppercase hover:underline"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
