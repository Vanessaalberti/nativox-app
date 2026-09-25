import type { Idioma, Resultado } from "@compartido/contratos";

export interface Medidas {
  // Una pasada de Whisper sobre el audio de muestra (mediana), en milisegundos.
  pasadaMs: number;
  // Traducir la frase de muestra a un idioma (mediana, promedio entre los idiomas), en milisegundos.
  traduccionMs: number;
}

// Lo que la medición necesita de afuera. Este módulo no importa a los que cargan los modelos: quien
// lo usa le pasa lo que ya tiene listo y la medición solo le pone el cronómetro.
export interface PiezasDeMedicion {
  // Una pasada completa de Whisper sobre la muestra (con el modelo ya cargado).
  transcribirMuestra(): Promise<Resultado<{ ms: number }>>;
  // Traducir la frase de muestra al idioma indicado.
  traducirMuestra(a: Idioma): Promise<Resultado<{ ms: number }>>;
}

export type PasoDeMedicion = {
  etapa: "transcribiendo" | "traduciendo";
  hecho: number;
  total: number;
};

// La primera pasada compila los shaders de la placa y siempre tarda mucho más: se descarta.
const PASADAS_DE_CALENTAMIENTO = 1;
const PASADAS_MEDIDAS = 3;

export async function medirEquipo(
  piezas: PiezasDeMedicion,
  idiomasDestino: readonly Idioma[],
  alPaso: (paso: PasoDeMedicion) => void = () => undefined,
): Promise<Resultado<Medidas>> {
  const total = PASADAS_DE_CALENTAMIENTO + PASADAS_MEDIDAS;

  const transcripciones: number[] = [];
  for (let i = 0; i < total; i++) {
    alPaso({ etapa: "transcribiendo", hecho: i, total });
    const pasada = await piezas.transcribirMuestra();
    if (!pasada.ok) return pasada;
    if (i >= PASADAS_DE_CALENTAMIENTO) transcripciones.push(pasada.valor.ms);
  }

  const traducciones: number[] = [];
  for (const [indice, destino] of idiomasDestino.entries()) {
    alPaso({ etapa: "traduciendo", hecho: indice, total: idiomasDestino.length });
    const porIdioma: number[] = [];
    for (let i = 0; i < total; i++) {
      const traduccion = await piezas.traducirMuestra(destino);
      if (!traduccion.ok) return traduccion;
      if (i >= PASADAS_DE_CALENTAMIENTO) porIdioma.push(traduccion.valor.ms);
    }
    traducciones.push(mediana(porIdioma));
  }

  return {
    ok: true,
    valor: {
      pasadaMs: mediana(transcripciones),
      traduccionMs: traducciones.length > 0 ? promedio(traducciones) : 0,
    },
  };
}

function mediana(valores: readonly number[]): number {
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  if (orden.length === 0) return 0;
  return orden.length % 2 === 1
    ? (orden[medio] ?? 0)
    : ((orden[medio - 1] ?? 0) + (orden[medio] ?? 0)) / 2;
}

function promedio(valores: readonly number[]): number {
  return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}
