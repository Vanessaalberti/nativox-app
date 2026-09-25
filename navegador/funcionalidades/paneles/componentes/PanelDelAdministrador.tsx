import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { EventoCompleto } from "@compartido/contratos";
import { leerEvento, salir } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Boton, ListaDeDatos } from "@navegador/interfaz/sistema-diseno";

type Carga =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; evento: EventoCompleto; email: string };

const TIPOS = { "todo-en-uno": "Todo en uno", "roles-separados": "Roles separados" };

const fecha = (valor: string | null) =>
  valor === null ? "sin definir" : new Date(`${valor}T00:00:00`).toLocaleDateString("es");

// /panel: lo que ve el administrador al entrar. Por ahora muestra el evento que creó y abre la
// sala de prueba; las salas, la agenda y los operadores llegan con sus pantallas.
export function PanelDelAdministrador() {
  const navegar = useNavigate();
  const [carga, setCarga] = useState<Carga>({ fase: "cargando" });

  useEffect(() => {
    void leerEvento().then((respuesta) => {
      setCarga(
        respuesta.ok
          ? { fase: "lista", ...respuesta.valor }
          : { fase: "error", motivo: respuesta.motivo },
      );
    });
  }, []);

  if (carga.fase !== "lista") {
    return (
      <MarcoDeEntrada>
        <p role={carga.fase === "error" ? "alert" : "status"} className="font-mono text-sm">
          {carga.fase === "error" ? carga.motivo : "Abriendo tu panel…"}
        </p>
      </MarcoDeEntrada>
    );
  }

  const { evento, email } = carga;
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
    <MarcoDeEntrada evento={{ nombre: evento.nombre, logo: evento.logo }} centrado={false}>
      <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
        Panel de administrador
      </span>
      <h1 className="mt-3 mb-8 font-display text-6xl leading-[0.95] font-extrabold tracking-tight uppercase">
        {evento.nombre}
      </h1>

      <ListaDeDatos filas={datos} />

      <div className="flex flex-wrap gap-4">
        <Link
          to="/sala/prueba/control"
          className="border-[3px] border-[#b8241f] bg-naranja px-6 py-3.5 font-mono text-sm font-bold tracking-widest uppercase hover:bg-[#e67b00]"
        >
          Abrir una sala de prueba →
        </Link>
        <Boton
          variante="secundario"
          onClick={() => {
            void salir().then(() => navegar("/", { replace: true }));
          }}
        >
          Salir
        </Boton>
      </div>
    </MarcoDeEntrada>
  );
}
