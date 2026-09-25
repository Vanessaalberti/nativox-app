import { buscarPausas } from "./pausas";

// Márgenes medidos en el laboratorio: 0,25 s en los bordes, y los silencios internos de más de
// 0,5 s quedan en 0,2 s (el equivalente local del `vad_filter` de Workers AI).
const MARGEN_BORDES = 0.25;
const SILENCIO_INTERNO_MAXIMO = 0.5;
const SILENCIO_INTERNO_ACORTADO = 0.2;
// Con menos de 0,1 s de voz no hay palabra: es un golpe o un ruido, y no se manda.
const VOZ_MINIMA = 0.1;

interface Audio {
  audio: Float32Array;
  silencios: boolean[];
  muestrasPorTrama: number;
}

// Devuelve las tramas [desde, hasta) con voz y un margen, o null si no hay voz.
export function recortarSilencio({ silencios, muestrasPorTrama }: Audio, segundosPorTrama: number) {
  const conVoz = silencios.filter((silencio) => !silencio).length;
  if (conVoz * segundosPorTrama < VOZ_MINIMA) return null;

  const margen = Math.round(MARGEN_BORDES / segundosPorTrama);
  const primera = silencios.indexOf(false);
  const ultima = silencios.lastIndexOf(false);
  return {
    desde: Math.max(0, primera - margen),
    hasta: Math.min(silencios.length, ultima + 1 + margen),
    muestrasPorTrama,
  };
}

export function acortarSilencios(
  { audio, silencios, muestrasPorTrama }: Audio,
  segundosPorTrama: number,
) {
  const pausasLargas = buscarPausas(
    silencios,
    Math.round(SILENCIO_INTERNO_MAXIMO / segundosPorTrama),
  );
  if (pausasLargas.length === 0) return audio;

  const queda = Math.round(SILENCIO_INTERNO_ACORTADO / segundosPorTrama);
  const partes: Float32Array[] = [];
  let cursor = 0;
  for (const { desde, hasta } of pausasLargas) {
    const corte = (desde + Math.floor(queda / 2)) * muestrasPorTrama;
    partes.push(audio.subarray(cursor, corte));
    cursor = (hasta - Math.ceil(queda / 2)) * muestrasPorTrama;
  }
  partes.push(audio.subarray(cursor));
  return unir(partes);
}

export function unir(partes: readonly Float32Array[]): Float32Array {
  const unido = new Float32Array(partes.reduce((total, parte) => total + parte.length, 0));
  let posicion = 0;
  for (const parte of partes) {
    unido.set(parte, posicion);
    posicion += parte.length;
  }
  return unido;
}
