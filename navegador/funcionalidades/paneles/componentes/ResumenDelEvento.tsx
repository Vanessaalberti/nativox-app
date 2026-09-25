import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { EventoCompleto } from "@compartido/contratos";
import { listarSalas } from "@navegador/modulos/cliente-instancia";
import { ListaDeDatos } from "@navegador/interfaz/sistema-diseno";

const TIPOS = { "todo-en-uno": "Todo en uno", "roles-separados": "Roles separados" };

const fecha = (valor: string | null) =>
  valor === null ? "sin definir" : new Date(`${valor}T00:00:00`).toLocaleDateString("es");

// La pestaña "Resumen": los datos del evento y cuántas salas y charlas hay.
export function ResumenDelEvento({ evento, email }: { evento: EventoCompleto; email: string }) {
  const [totales, setTotales] = useState<{ salas: number; charlas: number } | null>(null);

  useEffect(() => {
    void listarSalas().then((respuesta) => {
      if (!respuesta.ok) return;
      setTotales({
        salas: respuesta.valor.length,
        charlas: respuesta.valor.reduce((suma, sala) => suma + sala.charlas, 0),
      });
    });
  }, []);

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
      <div className="grid max-w-[560px] grid-cols-2 gap-4">
        {[
          ["Salas totales", totales?.salas],
          ["Charlas en agenda", totales?.charlas],
        ].map(([nombre, valor]) => (
          <div key={nombre} className="border-[1.5px] border-ink/25 bg-canvas p-4">
            <p className="font-display text-5xl leading-none">{valor ?? "…"}</p>
            <p className="mt-1 font-mono text-[10px] tracking-widest text-ink/60 uppercase">
              {nombre}
            </p>
          </div>
        ))}
      </div>

      {totales?.salas === 0 && (
        <p className="text-sm text-ink/70">
          Todavía no hay salas para mostrar acá. Creá la primera en la pestaña{" "}
          <Link to="/panel/salas" className="font-bold underline">
            Salas
          </Link>
          .
        </p>
      )}

      <div className="max-w-[760px]">
        <ListaDeDatos filas={datos} />
      </div>
    </div>
  );
}
