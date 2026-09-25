// Si la línea anterior quedó con la oración sin terminar, su último tramo (después de la última
// coma, hasta 8 palabras) se traduce junto con la nueva para que la frase tenga sentido. Va corto
// porque los modelos de lenguaje lo vuelven a traducir: con la línea entera el subtítulo tardaba
// 9,4 s; con el tramo, 7,6 s y la misma calidad.
const MAXIMO_PALABRAS_DE_CONTEXTO = 8;

export function ultimoTramoSinCerrar(anterior: string): string {
  const texto = anterior.trim();
  if (texto === "" || /[.?!…]["»”)]*$/.test(texto)) return "";

  const despuesDeLaComa = texto.slice(Math.max(texto.lastIndexOf(","), texto.lastIndexOf(";")) + 1);
  return despuesDeLaComa
    .trim()
    .split(/\s+/)
    .filter((palabra) => palabra !== "")
    .slice(-MAXIMO_PALABRAS_DE_CONTEXTO)
    .join(" ");
}
