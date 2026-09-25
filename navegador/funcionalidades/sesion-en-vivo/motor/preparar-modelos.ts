import type { Idioma, Resultado } from "@compartido/contratos";
import {
  conectarModelos,
  elegirVarianteWhisper,
  type Modelos,
  type VarianteWhisper,
} from "@navegador/modulos/modelos-compartidos";
import { crearBergamot, crearTranslateGemma, type Traductor } from "@navegador/modulos/traduccion";

export type ElegirTraductor = "bergamot" | "translategemma";

// Dónde se transcribe: en la placa de esta computadora o en Workers AI (por frases de 4 a 8 s).
export type DondeSeTranscribe = "local" | "nube";

interface ModelosLocales {
  modelos: Modelos;
  variante: VarianteWhisper;
  traductor: Traductor;
}

export interface ModelosListos {
  // Sin Whisper local (transcribiendo en la nube) no hay modelos de transcripción ni variante.
  modelos: Modelos | null;
  variante: VarianteWhisper | null;
  traductor: Traductor;
}

export interface AvanceDescarga {
  detalle: string;
  // 0 a 1, o null si no se sabe cuánto falta.
  proporcion: number | null;
}

// Los modelos se cargan una vez por pestaña: iniciar y detener la sesión no los vuelve a bajar.
let cargados: Promise<Resultado<ModelosLocales>> | null = null;

// TranslateGemma pesa ~2 a 3 GB: solo se baja si se elige, y también queda cargado por pestaña.
let gemma: Promise<Resultado<Traductor>> | null = null;

export function prepararModelos(
  pares: {
    de: Idioma;
    a: readonly Idioma[];
    traductor: ElegirTraductor;
    donde: DondeSeTranscribe;
  },
  alAvanzar: (avance: AvanceDescarga) => void,
): Promise<Resultado<ModelosListos>> {
  // En la nube no se baja Whisper: solo el traductor liviano (TranslateGemma pide la placa).
  if (pares.donde === "nube") return prepararEnLaNube(pares, alAvanzar);
  cargados ??= cargarUnaVez(alAvanzar).then((resultado) => {
    if (!resultado.ok) cargados = null;
    return resultado;
  });
  return cargados.then((resultado) => {
    if (!resultado.ok) return resultado;
    return pares.traductor === "translategemma"
      ? conGemma(resultado.valor, alAvanzar)
      : prepararTraducciones(resultado.valor, pares, alAvanzar);
  });
}

let bergamotSolo: Promise<Resultado<Traductor>> | null = null;

async function prepararEnLaNube(
  pares: { de: Idioma; a: readonly Idioma[] },
  alAvanzar: (avance: AvanceDescarga) => void,
): Promise<Resultado<ModelosListos>> {
  bergamotSolo ??= crearBergamot("/bergamot/translator.js").then((resultado) => {
    if (!resultado.ok) bergamotSolo = null;
    return resultado;
  });
  alAvanzar({ detalle: "Cargando el traductor", proporcion: null });
  const traductor = await bergamotSolo;
  if (!traductor.ok) return traductor;
  return prepararTraducciones(
    { modelos: null, variante: null, traductor: traductor.valor },
    pares,
    alAvanzar,
  );
}

async function conGemma(
  listos: ModelosLocales,
  alAvanzar: (avance: AvanceDescarga) => void,
): Promise<Resultado<ModelosListos>> {
  gemma ??= cargarGemma(listos, alAvanzar).then((resultado) => {
    if (!resultado.ok) gemma = null;
    return resultado;
  });
  const traductor = await gemma;
  return traductor.ok ? { ok: true, valor: { ...listos, traductor: traductor.valor } } : traductor;
}

async function cargarGemma(
  listos: ModelosLocales,
  alAvanzar: (avance: AvanceDescarga) => void,
): Promise<Resultado<Traductor>> {
  const detalle = "Descargando TranslateGemma (~2 a 3 GB, solo la primera vez)";
  alAvanzar({ detalle, proporcion: 0 });
  const carga = await listos.modelos.cargarGemma(listos.variante, (cargado, total) => {
    alAvanzar({ detalle, proporcion: total > 0 ? cargado / total : null });
  });
  if (!carga.ok) return carga;
  return {
    ok: true,
    valor: crearTranslateGemma({
      traducir: async (pedido) => {
        const traduccion = await listos.modelos.traducirGemma(pedido);
        return traduccion.ok ? { ok: true, valor: { texto: traduccion.valor.texto } } : traduccion;
      },
    }),
  };
}

async function cargarUnaVez(alAvanzar: (avance: AvanceDescarga) => void) {
  const variante = await elegirVarianteWhisper();
  if (!variante.ok) return variante;

  const worker = new Worker(new URL("../../../segundo-plano/modelos.worker.ts", import.meta.url), {
    type: "module",
  });
  const modelos = conectarModelos(worker);
  alAvanzar({ detalle: "Descargando Whisper (solo la primera vez)", proporcion: 0 });
  const whisper = await modelos.cargarWhisper(variante.valor, (cargado, total) => {
    alAvanzar({
      detalle: "Descargando Whisper (solo la primera vez)",
      proporcion: total > 0 ? cargado / total : null,
    });
  });
  if (!whisper.ok)
    return { ok: false as const, motivo: `No se pudo cargar Whisper: ${whisper.motivo}` };

  alAvanzar({ detalle: "Cargando el traductor", proporcion: null });
  const traductor = await crearBergamot("/bergamot/translator.js");
  if (!traductor.ok) return traductor;
  return {
    ok: true as const,
    valor: { modelos, variante: variante.valor, traductor: traductor.valor },
  };
}

// Bergamot baja el modelo de cada par la primera vez que traduce: se hace ahora, no con el primer
// subtítulo.
async function prepararTraducciones<T extends { traductor: Traductor }>(
  listos: T,
  pares: { de: Idioma; a: readonly Idioma[] },
  alAvanzar: (avance: AvanceDescarga) => void,
): Promise<Resultado<T>> {
  for (const a of pares.a) {
    alAvanzar({ detalle: `Preparando la traducción ${pares.de} → ${a}`, proporcion: null });
    const prueba = await listos.traductor.traducir("Hola.", pares.de, a);
    if (!prueba.ok) return prueba;
  }
  return { ok: true, valor: listos };
}
