import { cargarGemma, type Gemma } from "./gemma";
import { esPedido, type Pedido, type Respuesta } from "./protocolo";
import { cargarWhisper, type Whisper } from "./whisper";

interface Puerto {
  postMessage(mensaje: Respuesta): void;
  addEventListener(tipo: "message", escuchar: (evento: MessageEvent<unknown>) => void): void;
}

// Lado del worker: atiende los pedidos de la página. Los pedidos se procesan de a uno, en el
// orden en que llegan: hay una sola placa de video y dos pasadas a la vez se estorban.
export function atenderPedidos(puerto: Puerto): void {
  let whisper: Promise<Whisper> | null = null;
  let gemma: Promise<Gemma> | null = null;
  let turno: Promise<void> = Promise.resolve();

  const avisarProgreso = (id: number) => (cargado: number, total: number) => {
    puerto.postMessage({ tipo: "progreso", id, cargado, total });
  };

  const atender = async (pedido: Pedido) => {
    if (pedido.tipo === "cargar-whisper") {
      whisper ??= cargarWhisper(pedido.variante, avisarProgreso(pedido.id));
      await whisper;
      puerto.postMessage({ tipo: "cargado", id: pedido.id });
      return;
    }
    if (pedido.tipo === "cargar-gemma") {
      gemma ??= cargarGemma(pedido.variante, avisarProgreso(pedido.id));
      await gemma;
      puerto.postMessage({ tipo: "cargado", id: pedido.id });
      return;
    }
    if (pedido.tipo === "traducir-gemma") {
      if (!gemma) throw new Error("Primero hay que cargar TranslateGemma");
      const inicio = performance.now();
      const texto = await (await gemma).traducir(pedido);
      puerto.postMessage({
        tipo: "traducido",
        id: pedido.id,
        texto,
        ms: performance.now() - inicio,
      });
      return;
    }
    if (!whisper) throw new Error("Primero hay que cargar Whisper");
    const inicio = performance.now();
    const texto = await (await whisper).transcribir(pedido.audio, pedido);
    puerto.postMessage({
      tipo: "transcripto",
      id: pedido.id,
      texto,
      ms: performance.now() - inicio,
    });
  };

  puerto.addEventListener("message", ({ data }) => {
    if (!esPedido(data)) return;
    turno = turno.then(() =>
      atender(data).catch((error: unknown) => {
        // Si la carga falló, el próximo intento vuelve a empezar de cero.
        if (data.tipo === "cargar-whisper") whisper = null;
        if (data.tipo === "cargar-gemma") gemma = null;
        puerto.postMessage({
          tipo: "error",
          id: data.id,
          motivo: error instanceof Error ? error.message : String(error),
        });
      }),
    );
  });
}
