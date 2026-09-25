import type { Resultado } from "@compartido/contratos";
import { NOMBRE_PROCESADOR, urlDelProcesador } from "./procesador";
import { FRECUENCIA, type Captura, type FuenteAudio, type OpcionesCaptura } from "./tipos";

export async function listarFuentes(): Promise<FuenteAudio[]> {
  const dispositivos = await navigator.mediaDevices.enumerateDevices();
  return dispositivos
    .filter((dispositivo) => dispositivo.kind === "audioinput")
    .map((dispositivo, indice) => ({
      id: dispositivo.deviceId,
      // Sin permiso concedido, el navegador no dice el nombre del dispositivo.
      nombre: dispositivo.label || `Entrada de audio ${String(indice + 1)}`,
    }));
}

// Entrada del equipo (el cable de la consola) o micrófono. Sin cancelación de eco, supresión de
// ruido ni control de volumen: esos filtros están pensados para llamadas y le quitan a Whisper
// partes de la voz.
export async function abrirEntrada(
  idDispositivo: string | null,
  { alRecibir, alTerminar }: OpcionesCaptura,
): Promise<Resultado<Captura>> {
  const flujo = await pedirMicrofono(idDispositivo);
  if (!flujo.ok) return flujo;

  const contexto = new AudioContext({ sampleRate: FRECUENCIA });
  const url = urlDelProcesador();
  await contexto.audioWorklet.addModule(url);
  URL.revokeObjectURL(url);

  // Sin salidas: el nodo procesa igual y el audio nunca llega a los parlantes.
  const nodo = new AudioWorkletNode(contexto, NOMBRE_PROCESADOR, { numberOfOutputs: 0 });
  nodo.port.onmessage = (evento: MessageEvent<Float32Array>) => {
    alRecibir(evento.data);
  };
  contexto.createMediaStreamSource(flujo.valor).connect(nodo);

  const detener = () => {
    for (const pista of flujo.valor.getTracks()) pista.stop();
    nodo.port.onmessage = null;
    void contexto.close();
  };
  for (const pista of flujo.valor.getAudioTracks()) {
    pista.addEventListener("ended", () => {
      detener();
      alTerminar("Se cortó la entrada de audio (¿se desconectó el cable o el micrófono?).");
    });
  }
  return { ok: true, valor: { detener } };
}

async function pedirMicrofono(idDispositivo: string | null): Promise<Resultado<MediaStream>> {
  try {
    const flujo = await navigator.mediaDevices.getUserMedia({
      audio: {
        ...(idDispositivo ? { deviceId: { exact: idDispositivo } } : {}),
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    return { ok: true, valor: flujo };
  } catch (error) {
    return { ok: false, motivo: explicarErrorDeMicrofono(error) };
  }
}

function explicarErrorDeMicrofono(error: unknown): string {
  const nombre = error instanceof DOMException ? error.name : "";
  if (nombre === "NotAllowedError") {
    return "El navegador no dio permiso para usar el audio. Permitilo desde el candado de la barra de direcciones.";
  }
  if (nombre === "NotFoundError" || nombre === "OverconstrainedError") {
    return "No se encontró esa entrada de audio. Revisá que esté conectada y elegila de nuevo.";
  }
  return `No se pudo abrir la entrada de audio (${error instanceof Error ? error.message : String(error)}).`;
}
