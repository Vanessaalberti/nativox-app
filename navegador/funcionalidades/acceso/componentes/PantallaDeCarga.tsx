import { Boton } from "@navegador/interfaz/sistema-diseno";
import { MarcoDeEntrada } from "@navegador/interfaz/marco-de-entrada";
import type { CargaDelEstado } from "../hooks/useEstadoDeLaInstancia";

// Mientras se pregunta el estado de la instancia (o si la pregunta falla).
export function PantallaDeCarga({
  carga,
  alReintentar,
}: {
  carga: Exclude<CargaDelEstado, { fase: "lista" }>;
  alReintentar: () => void;
}) {
  return (
    <MarcoDeEntrada>
      {carga.fase === "cargando" ? (
        <p role="status" className="font-mono text-sm text-ink/70">
          Abriendo tu instancia…
        </p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p role="alert" className="max-w-[520px] font-mono text-sm text-[#b8241f]">
            {carga.motivo}
          </p>
          <Boton variante="secundario" onClick={alReintentar}>
            Probar de nuevo
          </Boton>
        </div>
      )}
    </MarcoDeEntrada>
  );
}
