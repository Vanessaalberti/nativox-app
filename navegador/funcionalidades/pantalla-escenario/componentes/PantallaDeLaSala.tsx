import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { esquemaIdioma, validar, type Idioma, type Transmision } from "@compartido/contratos";
import type { TamanoSubtitulo } from "@navegador/interfaz/subtitulos";
import { leerTransmisionDeSala } from "@navegador/modulos/cliente-instancia";
import { useSala } from "@navegador/modulos/cliente-sala";
import { PantallaEscenario } from "./PantallaEscenario";

const TAMANOS: readonly TamanoSubtitulo[] = ["S", "M", "L"];

// Lo que trae el link: ?idioma=en&tamano=L&original=0
function leerAjustes(parametros: URLSearchParams) {
  const idioma = validar(esquemaIdioma, parametros.get("idioma"));
  const tamano = TAMANOS.find((opcion) => opcion === parametros.get("tamano"));
  return {
    ...(idioma.ok ? { idioma: idioma.valor } : {}),
    ...(tamano ? { tamano } : {}),
    mostrarOriginal: parametros.get("original") !== "0",
  };
}

// /sala/:id/escenario — la pantalla del escenario en su propia pestaña, para abrirla en las
// pantallas de la sala con un link. Se conecta a la sala como cualquier espectador (sin sesión) y
// se puede dejar abierta: sigue sola.
export function PantallaDeLaSala({ salaId }: { salaId: string }) {
  const [transmision, setTransmision] = useState<Transmision | null>(null);
  const [parametros] = useSearchParams();

  useEffect(() => {
    void leerTransmisionDeSala(salaId).then((respuesta) => {
      if (respuesta.ok) setTransmision(respuesta.valor);
    });
  }, [salaId]);

  if (!transmision?.sala) return null;
  return (
    <Conectada
      salaId={salaId}
      idiomaOriginal={transmision.sala.idiomaOriginal}
      idiomasDestino={transmision.sala.idiomasDestino}
      inicial={leerAjustes(parametros)}
    />
  );
}

function Conectada({
  salaId,
  idiomaOriginal,
  idiomasDestino,
  inicial,
}: {
  salaId: string;
  idiomaOriginal: Idioma;
  idiomasDestino: readonly Idioma[];
  inicial: ReturnType<typeof leerAjustes>;
}) {
  const { lineas, conexion } = useSala(salaId, "espectador");
  return (
    <PantallaEscenario
      lineas={lineas}
      idiomaOriginal={idiomaOriginal}
      idiomasDestino={idiomasDestino}
      enVivo={conexion === "conectada"}
      inicial={inicial}
    />
  );
}
