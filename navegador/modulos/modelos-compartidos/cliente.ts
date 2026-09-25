import type { Resultado } from "@compartido/contratos";
import {
  esRespuesta,
  type OpcionesTranscribir,
  type Pedido,
  type PedidoDeTraduccion,
  type Respuesta,
  type VarianteWhisper,
} from "./protocolo";

export interface Modelos {
  cargarWhisper(
    variante: VarianteWhisper,
    alAvanzar: (cargado: number, total: number) => void,
  ): Promise<Resultado<undefined>>;
  transcribir(
    audio: Float32Array,
    opciones: OpcionesTranscribir,
  ): Promise<Resultado<{ texto: string; ms: number }>>;
  // TranslateGemma 4B (traducción de calidad, ~2,1 a 3,1 GB): se carga aparte y solo si se elige.
  cargarGemma(
    variante: VarianteWhisper,
    alAvanzar: (cargado: number, total: number) => void,
  ): Promise<Resultado<undefined>>;
  traducirGemma(pedido: PedidoDeTraduccion): Promise<Resultado<{ texto: string; ms: number }>>;
}

interface Puerto {
  postMessage(mensaje: Pedido, transferir?: Transferable[]): void;
  addEventListener(tipo: "message", escuchar: (evento: MessageEvent<unknown>) => void): void;
}

type Pendiente = (respuesta: Respuesta) => void;

// Transcribir y traducir con TranslateGemma responden lo mismo: un texto y lo que tardó.
function alResponderTexto(tipo: "transcripto" | "traducido") {
  return (
    respuesta: Respuesta,
    resolver: (resultado: Resultado<{ texto: string; ms: number }>) => void,
  ) => {
    if (respuesta.tipo === tipo) {
      resolver({ ok: true, valor: { texto: respuesta.texto, ms: respuesta.ms } });
    }
    if (respuesta.tipo === "error") resolver({ ok: false, motivo: respuesta.motivo });
  };
}

// Lado de la página: el worker se crea afuera (quien lo usa conoce su archivo) y se pasa acá.
export function conectarModelos(worker: Puerto): Modelos {
  const pendientes = new Map<number, Pendiente>();
  let proximoId = 0;

  worker.addEventListener("message", ({ data }) => {
    if (esRespuesta(data)) pendientes.get(data.id)?.(data);
  });

  function pedir<T>(
    armar: (id: number) => Pedido,
    alResponder: (respuesta: Respuesta, resolver: (resultado: Resultado<T>) => void) => void,
    transferir: Transferable[] = [],
  ): Promise<Resultado<T>> {
    const id = proximoId++;
    return new Promise((resolver) => {
      pendientes.set(id, (respuesta) => {
        alResponder(respuesta, (resultado) => {
          pendientes.delete(id);
          resolver(resultado);
        });
      });
      worker.postMessage(armar(id), transferir);
    });
  }

  function pedirCarga(
    tipo: "cargar-whisper" | "cargar-gemma",
    variante: VarianteWhisper,
    alAvanzar: (cargado: number, total: number) => void,
  ) {
    return pedir<undefined>(
      (id) => ({ tipo, id, variante }),
      (respuesta, resolver) => {
        if (respuesta.tipo === "progreso") alAvanzar(respuesta.cargado, respuesta.total);
        if (respuesta.tipo === "cargado") resolver({ ok: true, valor: undefined });
        if (respuesta.tipo === "error") resolver({ ok: false, motivo: respuesta.motivo });
      },
    );
  }

  return {
    cargarWhisper(variante, alAvanzar) {
      return pedirCarga("cargar-whisper", variante, alAvanzar);
    },
    cargarGemma(variante, alAvanzar) {
      return pedirCarga("cargar-gemma", variante, alAvanzar);
    },
    traducirGemma(pedido) {
      return pedir<{ texto: string; ms: number }>(
        (id) => ({ tipo: "traducir-gemma", id, ...pedido }),
        alResponderTexto("traducido"),
      );
    },
    transcribir(audio, opciones) {
      const copia = audio.slice();
      return pedir<{ texto: string; ms: number }>(
        (id) => ({ tipo: "transcribir", id, audio: copia, ...opciones }),
        alResponderTexto("transcripto"),
        [copia.buffer],
      );
    },
  };
}
