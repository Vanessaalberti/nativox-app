import { useEffect, useState } from "react";
import type { Transmision } from "@compartido/contratos";
import { SubtitulosDeTransmision } from "@navegador/interfaz/subtitulos";
import {
  leerTransmisionDeSala,
  leerTransmisionDeSalida,
} from "@navegador/modulos/cliente-instancia";
import { useSala } from "@navegador/modulos/cliente-sala";

export type FuenteDeTransmision = { tipo: "sala"; id: string } | { tipo: "salida"; numero: number };

// Una sala cambia de estilo rara vez; una salida cambia de sala al aire con un clic y eso tiene que
// verse enseguida, sin recargar el programa de transmisión.
const CADA_CUANTO_SE_PREGUNTA_MS = { sala: 10_000, salida: 2000 };

// La página que carga vMix u OBS (a 1920 × 1080): fondo transparente y solo los subtítulos. No
// tiene sesión ni controles; se conecta a la sala como cualquier espectador.
export function PaginaTransparente({ fuente }: { fuente: FuenteDeTransmision }) {
  const [transmision, setTransmision] = useState<Transmision | null>(null);
  const clave = fuente.tipo === "sala" ? fuente.id : String(fuente.numero);

  // El fondo de la página tiene que ser transparente para que se vea el video de atrás.
  useEffect(() => {
    const anteriorHtml = document.documentElement.style.background;
    const anteriorBody = document.body.style.background;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      document.documentElement.style.background = anteriorHtml;
      document.body.style.background = anteriorBody;
    };
  }, []);

  useEffect(() => {
    let vigente = true;
    const preguntar = async () => {
      const respuesta =
        fuente.tipo === "sala"
          ? await leerTransmisionDeSala(fuente.id)
          : await leerTransmisionDeSalida(fuente.numero);
      // Si falla, se sigue con lo último que se tenía: una falla de red no apaga los subtítulos.
      if (vigente && respuesta.ok) setTransmision(respuesta.valor);
    };
    void preguntar();
    const intervalo = setInterval(() => void preguntar(), CADA_CUANTO_SE_PREGUNTA_MS[fuente.tipo]);
    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
    // La fuente se identifica por `clave`.
  }, [clave]);

  if (!transmision?.sala) return null;
  return (
    <Subtitulos key={transmision.sala.id} salaId={transmision.sala.id} transmision={transmision} />
  );
}

function Subtitulos({ salaId, transmision }: { salaId: string; transmision: Transmision }) {
  const { lineas } = useSala(salaId, "espectador");
  if (!transmision.sala) return null;
  return (
    <SubtitulosDeTransmision
      lineas={lineas}
      idiomaOriginal={transmision.sala.idiomaOriginal}
      estilo={transmision.estilo}
    />
  );
}
