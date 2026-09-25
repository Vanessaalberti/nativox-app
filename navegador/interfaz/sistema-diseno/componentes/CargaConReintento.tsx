import { Boton } from "./Boton";

// Mientras se cargan los datos de una sección, o si la carga falló y se puede reintentar.
export function CargaConReintento({
  carga,
  textoCargando,
  alReintentar,
}: {
  carga: { fase: "cargando" } | { fase: "error"; motivo: string };
  textoCargando: string;
  alReintentar: () => void;
}) {
  if (carga.fase === "cargando") {
    return (
      <p role="status" className="font-mono text-sm text-ink/70">
        {textoCargando}
      </p>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="font-mono text-sm text-[#b8241f]">
        {carga.motivo}
      </p>
      <Boton variante="secundario" onClick={alReintentar}>
        Probar de nuevo
      </Boton>
    </div>
  );
}
