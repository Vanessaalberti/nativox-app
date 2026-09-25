import { NOMBRE_PROCESADOR, urlDelProcesador } from "./procesador";
import { FRECUENCIA, type Captura, type OpcionesCaptura } from "./tipos";

// Un contexto de audio a 16 kHz con el procesador que junta bloques de 100 ms. Sin salidas: el
// nodo procesa igual y el audio nunca llega a los parlantes.
export async function crearNodoDeCaptura(alRecibir: (bloque: Float32Array) => void) {
  const contexto = new AudioContext({ sampleRate: FRECUENCIA });
  const url = urlDelProcesador();
  await contexto.audioWorklet.addModule(url);
  URL.revokeObjectURL(url);

  const nodo = new AudioWorkletNode(contexto, NOMBRE_PROCESADOR, { numberOfOutputs: 0 });
  nodo.port.onmessage = (evento: MessageEvent<Float32Array>) => {
    alRecibir(evento.data);
  };
  return {
    contexto,
    nodo,
    cerrar: () => {
      nodo.port.onmessage = null;
      void contexto.close();
    },
  };
}

// Una fuente que ya es un flujo del navegador (micrófono, cable de consola, audio de una pestaña):
// se conecta al procesador y, si la pista se corta sola, avisa con `motivoDelCorte`.
export async function abrirDesdeFlujo(
  flujo: MediaStream,
  { alRecibir, alTerminar }: OpcionesCaptura,
  motivoDelCorte: string,
): Promise<Captura> {
  const { contexto, nodo, cerrar } = await crearNodoDeCaptura(alRecibir);
  contexto.createMediaStreamSource(flujo).connect(nodo);

  const detener = () => {
    for (const pista of flujo.getTracks()) pista.stop();
    cerrar();
  };
  for (const pista of flujo.getAudioTracks()) {
    pista.addEventListener("ended", () => {
      detener();
      alTerminar(motivoDelCorte);
    });
  }
  return { detener };
}
