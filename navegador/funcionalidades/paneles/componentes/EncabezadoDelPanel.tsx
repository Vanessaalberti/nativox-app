import { useNavigate } from "react-router";
import { salir } from "@navegador/modulos/cliente-instancia";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import { Boton } from "@navegador/interfaz/sistema-diseno";

// La cabecera de los paneles: qué panel es, el título grande y "Salir".
export function EncabezadoDelPanel({ etiqueta, titulo }: { etiqueta: string; titulo: string }) {
  const navegar = useNavigate();

  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="font-mono text-[11px] tracking-widest text-naranja uppercase">
          {etiqueta}
        </span>
        <h1 className="mt-2 font-display text-6xl leading-[0.95] font-extrabold tracking-tight uppercase">
          {titulo}
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
  );
}

// Mientras el panel carga (o si falla): el marco solo, con el mensaje.
export function PanelEnCarga({
  carga,
}: {
  carga: { fase: "cargando" | "error"; motivo?: string };
}) {
  return (
    <MarcoDeEntrada>
      <p role={carga.fase === "error" ? "alert" : "status"} className="font-mono text-sm">
        {carga.fase === "error" ? carga.motivo : "Abriendo tu panel…"}
      </p>
    </MarcoDeEntrada>
  );
}
