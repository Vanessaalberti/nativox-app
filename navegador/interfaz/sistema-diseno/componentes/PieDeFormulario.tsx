import { Aviso } from "./Aviso";
import { Boton } from "./Boton";

// El final de un formulario: el error (si lo hay) y el botón que lo envía.
export function PieDeFormulario({
  error,
  deshabilitado,
  etiqueta = "Guardar",
}: {
  error: string | null;
  deshabilitado: boolean;
  etiqueta?: string;
}) {
  return (
    <>
      {error !== null && <Aviso tipo="error">{error}</Aviso>}
      <div className="flex justify-end">
        <Boton type="submit" disabled={deshabilitado}>
          {etiqueta} →
        </Boton>
      </div>
    </>
  );
}
