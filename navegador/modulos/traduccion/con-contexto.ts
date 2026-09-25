import type { Resultado } from "@compartido/contratos";
import { proteger, restaurar, type EntradaGlosario } from "@compartido/glosario";
import type { Traductor } from "./tipos";

export interface PedidoTraduccion {
  texto: string;
  // Último tramo sin cerrar de la línea anterior (ver `ultimoTramoSinCerrar`); vacío si no hay.
  contexto: string;
  glosario: readonly EntradaGlosario[];
  de: string;
  a: string;
}

export interface Traduccion {
  texto: string;
  terminosPerdidos: string[];
  usoContexto: boolean;
}

// Control de confianza: con contexto, si vuelve mucho más corto que el original o se perdió un
// término del glosario, se descarta y se traduce el fragmento solo. El contexto nunca puede
// empeorar una traducción.
const PROPORCION_MINIMA_DE_PALABRAS = 0.75;

export async function traducirConContexto(
  traductor: Traductor,
  pedido: PedidoTraduccion,
): Promise<Resultado<Traduccion>> {
  const protegido = proteger(pedido.texto, pedido.glosario, pedido.a, traductor.marca);

  if (pedido.contexto !== "") {
    const conContexto = await traductor.traducir(
      armarConContexto(pedido.contexto, protegido.texto, traductor.marca),
      pedido.de,
      pedido.a,
    );
    if (!conContexto.ok) return conContexto;
    const nuevo = extraerLoNuevo(conContexto.valor, traductor.marca);
    if (nuevo !== null) {
      const restaurado = restaurar(nuevo, protegido);
      if (esConfiable(pedido.texto, restaurado)) {
        return { ok: true, valor: { ...restaurado, usoContexto: true } };
      }
    }
  }

  const solo = await traductor.traducir(protegido.texto, pedido.de, pedido.a);
  if (!solo.ok) return solo;
  return { ok: true, valor: { ...restaurar(solo.valor, protegido), usoContexto: false } };
}

function armarConContexto(contexto: string, nuevo: string, marca: Traductor["marca"]): string {
  if (marca === "html") return `${escaparHtml(contexto)} <span data-c>${nuevo}</span>`;
  return `${contexto}\n${nuevo}`;
}

function extraerLoNuevo(traducido: string, marca: Traductor["marca"]): string | null {
  // Sin HTML, el contexto va en su propio renglón: los traductores conservan el salto de línea.
  if (marca !== "html") return traducido.trim().split("\n").at(-1) ?? null;
  const apertura = /<span\s+data-c(?:="[^"]*")?\s*>/.exec(traducido);
  const cierre = traducido.lastIndexOf("</span>");
  if (!apertura || cierre < apertura.index) return null;
  return traducido.slice(apertura.index + apertura[0].length, cierre);
}

function esConfiable(
  original: string,
  { texto, terminosPerdidos }: { texto: string; terminosPerdidos: string[] },
) {
  const palabras = (frase: string) => frase.split(/\s+/).filter(Boolean).length;
  return (
    terminosPerdidos.length === 0 &&
    palabras(texto) >= palabras(original) * PROPORCION_MINIMA_DE_PALABRAS
  );
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
