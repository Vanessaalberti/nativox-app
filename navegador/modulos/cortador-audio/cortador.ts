import { calcularUmbral, energiasPorTrama, muestrasPorTrama, SEGUNDOS_POR_TRAMA } from "./energia";
import { buscarCorteDeFrase, buscarCorteForzado } from "./pausas";
import { acortarSilencios, recortarSilencio, unir } from "./silencios";

export interface Fragmento {
  numero: number;
  // Audio listo para transcribir: contexto del fragmento anterior + la parte nueva, sin
  // silencios en los bordes y con los silencios internos acortados.
  audio: Float32Array;
  // Segundos desde que empezó la captura, de la parte nueva (sin el contexto).
  inicio: number;
  fin: number;
  segundosDeContexto: number;
}

export interface Cortador {
  agregar(bloque: Float32Array): Fragmento[];
  terminar(): Fragmento[];
  cambiarMinimo(segundos: number): void;
  // Lo que se viene diciendo desde el último corte (para la transcripción provisoria).
  pendiente(): { audio: Float32Array; inicio: number; tieneVoz: boolean };
}

export interface OpcionesCortador {
  minimoSegundos: number;
  maximoSegundos?: number;
  contextoSegundos?: number;
  frecuencia?: number;
}

const PAUSA_DE_FRASE = 0.3;
const PAUSA_CORTA = 0.12;
// El piso de ruido se calcula con los últimos 30 s: se adapta si cambia la sala o el volumen.
const TRAMAS_DE_HISTORIAL = 3000;
// Silencio antes de que empiece a hablar: se descarta y solo se guardan 0,3 s.
const SILENCIO_INICIAL_QUE_SE_GUARDA = 0.3;

const aTramas = (segundos: number) => Math.round(segundos / SEGUNDOS_POR_TRAMA);

export function crearCortador(opciones: OpcionesCortador): Cortador {
  const frecuencia = opciones.frecuencia ?? 16_000;
  const maximoSegundos = opciones.maximoSegundos ?? 8;
  const contextoSegundos = opciones.contextoSegundos ?? 1.5;
  const porTrama = muestrasPorTrama(frecuencia);

  let minimoSegundos = opciones.minimoSegundos;
  let audio: Float32Array = new Float32Array(0);
  let energias: number[] = [];
  let historial: number[] = [];
  let inicio = 0;
  let numero = 0;
  let contexto: Float32Array = new Float32Array(0);

  const silencios = () => {
    const umbral = calcularUmbral(historial);
    return energias.map((energia) => energia < umbral);
  };

  function descartarSilencioInicial(enSilencio: boolean[]) {
    const guardar = aTramas(SILENCIO_INICIAL_QUE_SE_GUARDA);
    if (enSilencio.includes(false) || enSilencio.length <= guardar * 2) return;
    const sobra = enSilencio.length - guardar;
    audio = audio.slice(sobra * porTrama);
    energias = energias.slice(sobra);
    inicio += sobra * SEGUNDOS_POR_TRAMA;
  }

  function cortarEn(tramas: number, enSilencio: boolean[]): Fragmento | null {
    const crudo = audio.subarray(0, tramas * porTrama);
    const silenciosCrudo = enSilencio.slice(0, tramas);
    const inicioCrudo = inicio;
    audio = audio.slice(tramas * porTrama);
    energias = energias.slice(tramas);
    inicio += tramas * SEGUNDOS_POR_TRAMA;

    const conVoz = recortarSilencio(
      { audio: crudo, silencios: silenciosCrudo, muestrasPorTrama: porTrama },
      SEGUNDOS_POR_TRAMA,
    );
    if (!conVoz) {
      contexto = new Float32Array(0);
      return null;
    }
    const nuevo = acortarSilencios(
      {
        audio: crudo.subarray(conVoz.desde * porTrama, conVoz.hasta * porTrama),
        silencios: silenciosCrudo.slice(conVoz.desde, conVoz.hasta),
        muestrasPorTrama: porTrama,
      },
      SEGUNDOS_POR_TRAMA,
    );
    const fragmento = {
      numero: numero++,
      audio: unir([contexto, nuevo]),
      inicio: inicioCrudo + conVoz.desde * SEGUNDOS_POR_TRAMA,
      fin: inicioCrudo + conVoz.hasta * SEGUNDOS_POR_TRAMA,
      segundosDeContexto: contexto.length / frecuencia,
    };
    contexto = nuevo.slice(-Math.round(contextoSegundos * frecuencia));
    return fragmento;
  }

  function buscarCorte(enSilencio: boolean[]): number | null {
    const minimoTramas = aTramas(minimoSegundos);
    const maximoTramas = aTramas(maximoSegundos);
    if (enSilencio.length < minimoTramas) return null;

    const deFrase = buscarCorteDeFrase(enSilencio, {
      minimoTramas,
      pausaDeFrase: aTramas(PAUSA_DE_FRASE),
    });
    if (deFrase !== null) return deFrase;
    if (enSilencio.length < maximoTramas) return null;
    return buscarCorteForzado(enSilencio, {
      minimoTramas,
      maximoTramas,
      pausaCorta: aTramas(PAUSA_CORTA),
    });
  }

  return {
    agregar(bloque) {
      const medidas = energias.length * porTrama;
      audio = unir([audio, bloque]);
      const nuevas = energiasPorTrama(audio.subarray(medidas), frecuencia);
      energias.push(...nuevas);
      historial = [...historial, ...nuevas].slice(-TRAMAS_DE_HISTORIAL);

      const fragmentos: Fragmento[] = [];
      descartarSilencioInicial(silencios());
      for (let corte = buscarCorte(silencios()); corte !== null; corte = buscarCorte(silencios())) {
        const fragmento = cortarEn(corte, silencios());
        if (fragmento) fragmentos.push(fragmento);
      }
      return fragmentos;
    },

    terminar() {
      const fragmento = energias.length > 0 ? cortarEn(energias.length, silencios()) : null;
      audio = new Float32Array(0);
      return fragmento ? [fragmento] : [];
    },

    cambiarMinimo(segundos) {
      minimoSegundos = segundos;
    },

    pendiente() {
      return { audio: audio.slice(), inicio, tieneVoz: silencios().includes(false) };
    },
  };
}
