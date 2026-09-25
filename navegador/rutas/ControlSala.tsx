import { useCallback, useState } from "react";
import { useParams } from "react-router";
import { PantallaEscenario } from "@navegador/funcionalidades/pantalla-escenario";
import { SesionEnVivo, useSesionEnVivo } from "@navegador/funcionalidades/sesion-en-vivo";

// /sala/:id/control — la sesión en vivo y, arriba, la pantalla del escenario cuando se abre.
export function ControlSala() {
  const { id = "" } = useParams();
  const sesion = useSesionEnVivo();
  const [conEscenario, setConEscenario] = useState(false);
  const cerrarEscenario = useCallback(() => setConEscenario(false), []);

  return (
    <>
      <SesionEnVivo
        nombreSala={`Sala ${id}`}
        sesion={sesion}
        alAbrirEscenario={() => setConEscenario(true)}
      />
      {conEscenario && (
        <PantallaEscenario
          lineas={sesion.lineas}
          idiomaOriginal={sesion.idiomas.original}
          idiomasDestino={sesion.idiomas.destino}
          enVivo={sesion.estado.fase === "en-vivo"}
          alSalir={cerrarEscenario}
        />
      )}
    </>
  );
}
