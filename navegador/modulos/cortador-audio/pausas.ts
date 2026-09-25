interface Pausa {
  desde: number;
  hasta: number;
}

// Pausas en tramas: corridas de tramas en silencio de al menos `minimo` de largo.
export function buscarPausas(silencios: readonly boolean[], minimo: number): Pausa[] {
  const pausas: Pausa[] = [];
  let desde = -1;
  for (let i = 0; i <= silencios.length; i++) {
    const enSilencio = silencios[i] === true;
    if (enSilencio && desde === -1) desde = i;
    if (!enSilencio && desde !== -1) {
      if (i - desde >= minimo) pausas.push({ desde, hasta: i });
      desde = -1;
    }
  }
  return pausas;
}

// Corte de fin de frase: la primera pausa de ≥ 0,3 s que termina pasado el mínimo. Se corta a
// 0,15 s de empezada la pausa: la frase queda entera y el resto del silencio se recorta después.
export function buscarCorteDeFrase(
  silencios: readonly boolean[],
  { minimoTramas, pausaDeFrase }: { minimoTramas: number; pausaDeFrase: number },
): number | null {
  const pausa = buscarPausas(silencios, pausaDeFrase).find(({ hasta }) => hasta >= minimoTramas);
  if (!pausa) return null;
  return Math.max(pausa.desde + Math.floor(pausaDeFrase / 2), minimoTramas);
}

// Al llegar al máximo sin fin de frase: la pausa corta más larga (≥ 0,12 s) entre el mínimo y
// el máximo, cortada por la mitad; si no hay ninguna, en el máximo.
export function buscarCorteForzado(
  silencios: readonly boolean[],
  {
    minimoTramas,
    maximoTramas,
    pausaCorta,
  }: Record<"minimoTramas" | "maximoTramas" | "pausaCorta", number>,
): number {
  const candidatas = buscarPausas(silencios.slice(0, maximoTramas), pausaCorta).filter(
    ({ desde }) => desde >= minimoTramas,
  );
  const mejor = candidatas.reduce<Pausa | null>(
    (elegida, pausa) =>
      !elegida || pausa.hasta - pausa.desde > elegida.hasta - elegida.desde ? pausa : elegida,
    null,
  );
  return mejor ? Math.floor((mejor.desde + mejor.hasta) / 2) : maximoTramas;
}
