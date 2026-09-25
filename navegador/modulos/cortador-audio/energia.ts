// El audio se mide en tramas de 10 ms: alcanza para ver una pausa de 0,12 s (12 tramas) y es
// barato de calcular en cada bloque.
export const SEGUNDOS_POR_TRAMA = 0.01;

// Umbral de silencio relativo al ruido de la toma: el percentil 15 de la energía reciente es el
// "piso" de la sala; lo que no lo supera por 2,5 veces es silencio. El mínimo absoluto evita que
// un archivo con silencio digital (ceros) deje el umbral en 0 y nada cuente como pausa.
const PERCENTIL_RUIDO = 15;
const VECES_SOBRE_EL_RUIDO = 2.5;
const UMBRAL_MINIMO = 0.002;
// Si la toma arranca hablando sin pausas, el percentil 15 cae sobre la voz: el umbral nunca pasa
// de la mitad de la parte fuerte (percentil 90), así la voz no se toma por silencio.
const PERCENTIL_VOZ = 90;
const FRACCION_DE_LA_VOZ = 0.5;

export function muestrasPorTrama(frecuencia: number): number {
  return Math.round(frecuencia * SEGUNDOS_POR_TRAMA);
}

export function energiasPorTrama(audio: Float32Array, frecuencia: number): number[] {
  const largo = muestrasPorTrama(frecuencia);
  const energias: number[] = [];
  for (let inicio = 0; inicio + largo <= audio.length; inicio += largo) {
    let suma = 0;
    for (let i = inicio; i < inicio + largo; i++) {
      const muestra = audio[i] ?? 0;
      suma += muestra * muestra;
    }
    energias.push(Math.sqrt(suma / largo));
  }
  return energias;
}

export function calcularUmbral(energiasRecientes: readonly number[]): number {
  if (energiasRecientes.length === 0) return UMBRAL_MINIMO;
  const ordenadas = [...energiasRecientes].sort((a, b) => a - b);
  const percentil = (p: number) => ordenadas[Math.floor((p / 100) * (ordenadas.length - 1))] ?? 0;
  const segunRuido = percentil(PERCENTIL_RUIDO) * VECES_SOBRE_EL_RUIDO;
  const topeSegunVoz = percentil(PERCENTIL_VOZ) * FRACCION_DE_LA_VOZ;
  return Math.max(Math.min(segunRuido, topeSegunVoz), UMBRAL_MINIMO);
}
