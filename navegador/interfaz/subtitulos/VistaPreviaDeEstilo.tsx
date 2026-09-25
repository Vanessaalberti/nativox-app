import type { EstiloSalida, Idioma, Linea } from "@compartido/contratos";
import { SubtitulosDeTransmision } from "./SubtitulosDeTransmision";

const MUESTRA: Linea[] = [
  {
    tipo: "linea",
    id: "muestra-1",
    original: "Hoy vamos a hablar de cómo construir productos abiertos y accesibles.",
    traducciones: {
      en: "Today we are going to talk about building open, accessible products.",
      pt: "Hoje vamos falar sobre como construir produtos abertos e acessíveis.",
    },
    provisoria: false,
    inicio: 0,
    fin: 4,
  },
  {
    tipo: "linea",
    id: "muestra-2",
    original: "La tecnología no debería ser una barrera de idioma.",
    traducciones: {
      en: "Technology should never be a language barrier.",
      pt: "A tecnologia não deveria ser uma barreira de idioma.",
    },
    provisoria: false,
    inicio: 4,
    fin: 7,
  },
  {
    tipo: "linea",
    id: "muestra-3",
    original: "Y con Nativox llega a todas las salas al mismo tiempo.",
    traducciones: {
      en: "And with Nativox it reaches every room at the same time.",
      pt: "E com o Nativox chega a todas as salas ao mesmo tempo.",
    },
    provisoria: false,
    inicio: 7,
    fin: 10,
  },
];

// Cómo se ve el estilo elegido sobre un fondo de escenario (16:9), con frases de muestra.
export function VistaPreviaDeEstilo({
  estilo,
  idiomaOriginal,
}: {
  estilo: EstiloSalida;
  idiomaOriginal: Idioma;
}) {
  return (
    <div
      className="relative aspect-video w-full overflow-hidden bg-escenario"
      style={{ containerType: "inline-size" }}
      role="img"
      aria-label="Vista previa de los subtítulos"
    >
      <SubtitulosDeTransmision
        lineas={MUESTRA}
        idiomaOriginal={idiomaOriginal}
        estilo={estilo}
        vistaPrevia
      />
    </div>
  );
}
