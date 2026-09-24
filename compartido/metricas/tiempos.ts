const PERCENTIL_EN_VIVO = 80;

// "Llega en vivo": procesar cada fragmento tarda menos que lo que dura ese fragmento (con su
// largo real, no contra un largo fijo). Se mira el percentil 80 para que un fragmento lento
// suelto no cambie el veredicto, pero una cola que crece sí.
export function llegaEnVivo(duraciones: readonly number[], largos: readonly number[]): boolean {
  if (duraciones.length !== largos.length) {
    throw new Error(
      `llegaEnVivo necesita un largo por duración (${String(duraciones.length)} duraciones, ${String(largos.length)} largos)`,
    );
  }
  if (duraciones.length === 0) return false;

  const proporciones = duraciones.map((duracion, i) => duracion / (largos[i] ?? Number.NaN));
  return percentil(proporciones, PERCENTIL_EN_VIVO) < 1;
}

// Percentil por rango más cercano: devuelve un valor que existe en la lista.
function percentil(valores: readonly number[], p: number): number {
  const ordenados = [...valores].sort((a, b) => a - b);
  const posicion = Math.ceil((p / 100) * ordenados.length) - 1;
  return ordenados[Math.max(0, posicion)] ?? Number.NaN;
}
