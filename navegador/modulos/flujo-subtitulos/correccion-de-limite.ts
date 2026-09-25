import { corregirTranscripcion, type EntradaGlosario } from "@compartido/glosario";

const PALABRAS_A_CADA_LADO = 3;

// El corte puede partir un término ("…como Workers Day" | "de AI de Cloudflare"). Se revisa la
// unión de las últimas 1–3 palabras de la línea anterior con las primeras 1–3 de la nueva: si ahí
// aparece un término que toma palabras de los dos lados, pasa entero a la línea anterior.
export function corregirLimite(
  anterior: string,
  nuevo: string,
  glosario: readonly EntradaGlosario[],
): { anterior: string; nuevo: string; cambio: boolean } {
  const previas = anterior.split(/\s+/).filter(Boolean);
  const siguientes = nuevo.split(/\s+/).filter(Boolean);

  for (let atras = Math.min(PALABRAS_A_CADA_LADO, previas.length); atras >= 1; atras--) {
    for (
      let adelante = Math.min(PALABRAS_A_CADA_LADO, siguientes.length);
      adelante >= 1;
      adelante--
    ) {
      const union = [...previas.slice(-atras), ...siguientes.slice(0, adelante)].join(" ");
      const { texto, correcciones } = corregirTranscripcion(union, glosario);
      const esUnSoloTermino = correcciones.length === 1 && correcciones[0]?.desde === union;
      if (esUnSoloTermino) {
        return {
          anterior: [...previas.slice(0, -atras), texto].join(" "),
          nuevo: siguientes.slice(adelante).join(" "),
          cambio: true,
        };
      }
    }
  }
  return { anterior, nuevo, cambio: false };
}
