import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import type { EventoCompleto } from "@compartido/contratos";
import { leerEvento, salir } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Boton } from "@navegador/interfaz/sistema-diseno";

type Carga =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; evento: EventoCompleto; email: string };

export type PestanaDelPanel = "resumen" | "salas";

const PESTANAS: { id: PestanaDelPanel; nombre: string; ruta: string }[] = [
  { id: "resumen", nombre: "Resumen", ruta: "/panel" },
  { id: "salas", nombre: "Salas", ruta: "/panel/salas" },
];

// El marco del panel del administrador: el nombre del evento, las pestañas y, adentro, lo que
// pasa cada ruta. `children` recibe el evento y el email de la cuenta ya cargados.
export function PanelDelAdministrador({
  activa,
  children,
}: {
  activa: PestanaDelPanel;
  children: (datos: { evento: EventoCompleto; email: string }) => ReactNode;
}) {
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
  return (
    <MarcoDeEntrada
      evento={{ nombre: evento.nombre, logo: evento.logo }}
      centrado={false}
      ancho="ancho"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
            Panel de administrador
          </span>
          <h1 className="mt-2 font-display text-6xl leading-[0.95] font-extrabold tracking-tight uppercase">
            {evento.nombre}
          </h1>
        </div>
        <Boton
          variante="secundario"
          onClick={() => {
            void salir().then(() => navegar("/", { replace: true }));
          }}
        >
          Salir
        </Boton>
      </div>

      <nav
        aria-label="Secciones del panel"
        className="mb-8 flex gap-6 border-b border-linea-fuerte"
      >
        {PESTANAS.map((pestana) => (
          <Link
            key={pestana.id}
            to={pestana.ruta}
            aria-current={pestana.id === activa ? "page" : undefined}
            className={`-mb-px border-b-[3px] pb-3 font-mono text-xs font-bold tracking-widest uppercase ${pestana.id === activa ? "border-naranja text-ink" : "border-transparent text-ink/50 hover:text-ink"}`}
          >
            {pestana.nombre}
          </Link>
        ))}
      </nav>

      {children({ evento, email })}
    </MarcoDeEntrada>
  );
}
