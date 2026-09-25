import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { EventoCompleto, SalaPublica } from "@compartido/contratos";
import { leerAudiencia } from "@navegador/modulos/cliente-instancia";
import { EnlaceDeAccion, ListaDeDatos } from "@navegador/interfaz/sistema-diseno";

const TIPOS = { "todo-en-uno": "Todo en uno", "roles-separados": "Roles separados" };

const fecha = (valor: string | null) =>
  valor === null ? "sin definir" : new Date(`${valor}T00:00:00`).toLocaleDateString("es");

const CADA_CUANTO_SE_ACTUALIZA_MS = 10_000;

// La pestaña "Resumen": cómo le está yendo al evento de un vistazo (cuántas salas hay y cuáles
// están en vivo) y los datos del evento.
export function ResumenDelEvento({ evento, email }: { evento: EventoCompleto; email: string }) {
  const [salas, setSalas] = useState<SalaPublica[] | null>(null);

  useEffect(() => {
    let vigente = true;
    const cargar = () =>
      void leerAudiencia().then((respuesta) => {
        if (vigente && respuesta.ok) setSalas(respuesta.valor.salas);
      });
    cargar();
    const intervalo = setInterval(cargar, CADA_CUANTO_SE_ACTUALIZA_MS);
    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, []);

  const totales = [
    ["Salas totales", salas?.length],
    ["Salas en vivo", salas?.filter((sala) => sala.enVivo).length],
    ["Charlas en agenda", salas?.reduce((suma, sala) => suma + sala.charlas.length, 0)],
  ] as const;

  const datos: [string, string][] = [
    ["Tipo", TIPOS[evento.tipo]],
    ["Administrador", email],
    ["Fechas", `${fecha(evento.fechaInicio)} → ${fecha(evento.fechaFin)}`],
    [
      "Estimación",
      `${String(evento.salasSimultaneas)} salas a la vez · ${String(evento.horasPorDia)} h por día · ${String(evento.dias)} ${evento.dias === 1 ? "día" : "días"}`,
    ],
    ["Transcripción en la nube", evento.nubeComoRespaldo ? "Como respaldo" : "No"],
  ];

  return (
    <div className="flex flex-col gap-8">
      <p className="text-base text-ink/80">Cómo le está yendo a tu evento, de un vistazo.</p>
      <div className="grid max-w-[840px] gap-4 sm:grid-cols-3">
        {totales.map(([nombre, valor]) => (
          <div key={nombre} className="border-[1.5px] border-ink/25 bg-canvas p-4">
            <p className="font-display text-5xl leading-none">{valor ?? "…"}</p>
            <p className="mt-1 font-mono text-[10px] tracking-widest text-ink/60 uppercase">
              {nombre}
            </p>
          </div>
        ))}
      </div>

      {salas?.length === 0 ? (
        <p className="text-sm text-ink/70">
          Todavía no hay salas para mostrar acá. Creá la primera en la pestaña{" "}
          <Link to="/panel/salas" className="font-bold underline">
            Salas
          </Link>
          .
        </p>
      ) : (
        salas && (
          <div className="max-w-[1000px] overflow-x-auto border-[1.5px] border-ink/25 bg-canvas">
            <table className="w-full min-w-[520px]">
              <thead className="border-b border-linea-fuerte">
                <tr>
                  {["Sala", "Estado", "Monitoreo"].map((columna) => (
                    <th
                      key={columna}
                      className="px-5 py-3 text-left font-mono text-[10px] font-bold tracking-widest uppercase"
                    >
                      {columna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salas.map((sala) => (
                  <tr key={sala.id} className="border-b border-linea last:border-0">
                    <td className="px-5 py-3.5 font-mono text-sm">{sala.nombre}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase ${sala.enVivo ? "bg-verde/30" : "bg-ink/10 text-ink/60"}`}
                      >
                        {sala.enVivo ? "● En vivo" : "Sin transmitir"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <EnlaceDeAccion a={`/sala/${sala.id}/monitoreo`}>
                        Abrir monitoreo
                      </EnlaceDeAccion>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <div className="max-w-[760px]">
        <ListaDeDatos filas={datos} />
      </div>
    </div>
  );
}
