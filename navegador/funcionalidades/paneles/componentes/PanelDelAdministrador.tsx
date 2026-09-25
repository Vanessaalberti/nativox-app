import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import type { EventoCompleto } from "@compartido/contratos";
import { leerEvento } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { EncabezadoDelPanel, PanelEnCarga } from "./EncabezadoDelPanel";

type Carga =
  | { fase: "cargando" }
  | { fase: "error"; motivo: string }
  | { fase: "lista"; evento: EventoCompleto; email: string };

type PestanaDelPanel = "resumen" | "salas" | "operadores" | "produccion" | "ajustes";

const PESTANAS: {
  id: PestanaDelPanel;
  nombre: string;
  ruta: string;
  // Solo con roles separados hay un equipo al que invitar.
  soloConEquipo?: true;
}[] = [
  { id: "resumen", nombre: "Resumen", ruta: "/panel" },
  { id: "salas", nombre: "Salas", ruta: "/panel/salas" },
  { id: "operadores", nombre: "Operadores", ruta: "/panel/operadores", soloConEquipo: true },
  { id: "produccion", nombre: "Producción", ruta: "/panel/produccion" },
  { id: "ajustes", nombre: "Ajustes", ruta: "/panel/ajustes" },
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

  if (carga.fase !== "lista") return <PanelEnCarga carga={carga} />;

  const { evento, email } = carga;
  return (
    <MarcoDeEntrada
      evento={{ nombre: evento.nombre, logo: evento.logo }}
      centrado={false}
      ancho="ancho"
    >
      <EncabezadoDelPanel etiqueta="Panel de administrador" titulo={evento.nombre} />

      <nav
        aria-label="Secciones del panel"
        className="mb-8 flex gap-6 border-b border-linea-fuerte"
      >
        {PESTANAS.filter(
          (pestana) => !pestana.soloConEquipo || evento.tipo === "roles-separados",
        ).map((pestana) => (
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
