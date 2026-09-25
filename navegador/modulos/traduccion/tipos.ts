import type { Resultado } from "@compartido/contratos";
import type { Marca } from "@compartido/glosario";

// Misma interfaz para todos los traductores. Cada uno solo declara qué marca respeta (`html`
// para los que tienen modo HTML, como Bergamot; `codigo` para los modelos de lenguaje, como
// TranslateGemma) y hereda el glosario protegido, el contexto y el control de confianza.
export interface Traductor {
  nombre: string;
  marca: Marca;
  nivel: "rapido" | "calidad";
  traducir(texto: string, de: string, a: string): Promise<Resultado<string>>;
}
