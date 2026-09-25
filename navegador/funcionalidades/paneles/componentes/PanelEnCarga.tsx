import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";

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
