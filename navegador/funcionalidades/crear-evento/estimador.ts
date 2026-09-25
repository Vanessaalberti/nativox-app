// Lo que cuesta transcribir en la nube (Workers AI, whisper-large-v3-turbo), según la página de
// precios de Cloudflare: 46,63 neuronas por minuto de audio, 10.000 neuronas gratis por día y
// 0,011 USD cada 1.000 neuronas de más. Se factura ~120 % del audio hablado. Si Cloudflare cambia
// los precios, se actualizan estas cuatro constantes.
const NEURONAS_POR_MINUTO = 46.63;
const FACTOR_DE_FACTURACION = 1.2;
const NEURONAS_GRATIS_POR_DIA = 10_000;
const USD_POR_MIL_NEURONAS = 0.011;

const NEURONAS_POR_HORA_DE_SALA = 60 * NEURONAS_POR_MINUTO * FACTOR_DE_FACTURACION;

export interface Duracion {
  salasSimultaneas: number;
  horasPorDia: number;
  dias: number;
}

export interface EstimacionDeNube {
  // Horas de sala por día que entran en lo gratis (de todas las salas juntas).
  horasGratisPorDia: number;
  usdPorHoraDeSala: number;
  // Si TODAS las salas transcribieran en la nube durante todo el evento.
  usdTotal: number;
}

export function estimarNube({ salasSimultaneas, horasPorDia, dias }: Duracion): EstimacionDeNube {
  const neuronasPorDia = salasSimultaneas * horasPorDia * NEURONAS_POR_HORA_DE_SALA;
  const usdPorDia =
    (Math.max(0, neuronasPorDia - NEURONAS_GRATIS_POR_DIA) / 1000) * USD_POR_MIL_NEURONAS;
  return {
    horasGratisPorDia: NEURONAS_GRATIS_POR_DIA / NEURONAS_POR_HORA_DE_SALA,
    usdPorHoraDeSala: (NEURONAS_POR_HORA_DE_SALA / 1000) * USD_POR_MIL_NEURONAS,
    usdTotal: usdPorDia * dias,
  };
}

// Texto → número entero dentro de los límites; lo que no es un número deja el valor anterior.
export function acotar(
  texto: string,
  limites: { minimo: number; maximo: number },
  actual: number,
): number {
  const numero = Math.round(Number(texto));
  if (texto.trim() === "" || !Number.isFinite(numero)) return actual;
  return Math.min(limites.maximo, Math.max(limites.minimo, numero));
}
