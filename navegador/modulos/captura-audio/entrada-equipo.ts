import type { Resultado } from "@compartido/contratos";
import { abrirDesdeFlujo } from "./nodo-de-captura";
import type { Captura, FuenteAudio, OpcionesCaptura } from "./tipos";

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

// Entrada del equipo (el cable de la consola) o micrófono. Por defecto sin cancelación de eco,
// supresión de ruido ni control de volumen: esos filtros están pensados para llamadas y con una
// señal limpia de consola le quitan a Whisper partes de la voz. Con `conFiltrosDeVoz` (micrófono
// de notebook o auricular) se prenden, porque ahí el ruido de la sala sí le hace más daño.
export async function abrirEntrada(
  idDispositivo: string | null,
  { alRecibir, alTerminar, conFiltrosDeVoz = false }: OpcionesCaptura,
): Promise<Resultado<Captura>> {
  const flujo = await pedirMicrofono(idDispositivo, conFiltrosDeVoz);
  if (!flujo.ok) return flujo;

  return {
    ok: true,
    valor: await abrirDesdeFlujo(
      flujo.valor,
      { alRecibir, alTerminar },
      "Se cortó la entrada de audio (¿se desconectó el cable o el micrófono?).",
    ),
  };
}

async function pedirMicrofono(
  idDispositivo: string | null,
  conFiltrosDeVoz: boolean,
): Promise<Resultado<MediaStream>> {
  try {
    const flujo = await navigator.mediaDevices.getUserMedia({
      audio: {
        ...(idDispositivo ? { deviceId: { exact: idDispositivo } } : {}),
        channelCount: 1,
        echoCancellation: conFiltrosDeVoz,
        noiseSuppression: conFiltrosDeVoz,
        autoGainControl: conFiltrosDeVoz,
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
