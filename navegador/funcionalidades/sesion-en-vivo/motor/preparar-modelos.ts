import type { Idioma, Resultado } from "@compartido/contratos";
import {
  conectarModelos,
  elegirVarianteWhisper,
  type Modelos,
  type VarianteWhisper,
} from "@navegador/modulos/modelos-compartidos";
import { crearBergamot, type Traductor } from "@navegador/modulos/traduccion";

export interface ModelosListos {
  modelos: Modelos;
  variante: VarianteWhisper;
  traductor: Traductor;
}

export interface AvanceDescarga {
  detalle: string;
  // 0 a 1, o null si no se sabe cuánto falta.
  proporcion: number | null;
}

// Los modelos se cargan una vez por pestaña: iniciar y detener la sesión no los vuelve a bajar.
let cargados: Promise<Resultado<ModelosListos>> | null = null;

export function prepararModelos(
  pares: { de: Idioma; a: readonly Idioma[] },
  alAvanzar: (avance: AvanceDescarga) => void,
): Promise<Resultado<ModelosListos>> {
  cargados ??= cargarUnaVez(alAvanzar).then((resultado) => {
    if (!resultado.ok) cargados = null;
    return resultado;
  });
  return cargados.then((resultado) =>
    resultado.ok ? prepararTraducciones(resultado.valor, pares, alAvanzar) : resultado,
  );
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
async function prepararTraducciones(
  listos: ModelosListos,
  pares: { de: Idioma; a: readonly Idioma[] },
  alAvanzar: (avance: AvanceDescarga) => void,
): Promise<Resultado<ModelosListos>> {
  for (const a of pares.a) {
    alAvanzar({ detalle: `Preparando la traducción ${pares.de} → ${a}`, proporcion: null });
    const prueba = await listos.traductor.traducir("Hola.", pares.de, a);
    if (!prueba.ok) return prueba;
  }
  return { ok: true, valor: listos };
}
