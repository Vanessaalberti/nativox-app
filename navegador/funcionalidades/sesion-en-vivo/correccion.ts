const PUNTUACION_EN_LOS_BORDES = /^[¿¡"“(]+|[.,;:!?"”)]+$/g;
const MAXIMO_DE_PALABRAS = 3;

const palabrasDe = (texto: string) =>
  texto
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.replace(PUNTUACION_EN_LOS_BORDES, ""))
    .filter((palabra) => palabra !== "");

// Si lo que se corrigió a mano fue una o pocas palabras (un nombre, una sigla, un término), lo
// devuelve como entrada de glosario: "Cloudflare ~ cloudfler" (lo correcto ~ lo que se había
// escrito mal), para que las próximas frases ya salgan bien. Si el cambio es una reescritura larga,
// no sugiere nada.
export function sugerirTermino(antes: string, despues: string): string | null {
  const viejas = palabrasDe(antes);
  const nuevas = palabrasDe(despues);
  let inicio = 0;
  while (inicio < viejas.length && inicio < nuevas.length && viejas[inicio] === nuevas[inicio]) {
    inicio++;
  }
  let fin = 0;
  while (
    fin < viejas.length - inicio &&
    fin < nuevas.length - inicio &&
    viejas[viejas.length - 1 - fin] === nuevas[nuevas.length - 1 - fin]
  ) {
    fin++;
  }
  const cambioViejo = viejas.slice(inicio, viejas.length - fin);
  const cambioNuevo = nuevas.slice(inicio, nuevas.length - fin);
  if (cambioViejo.length === 0 || cambioNuevo.length === 0) return null;
  if (cambioViejo.length > MAXIMO_DE_PALABRAS || cambioNuevo.length > MAXIMO_DE_PALABRAS) {
    return null;
  }
  return `${cambioNuevo.join(" ")} ~ ${cambioViejo.join(" ")}`;
}
