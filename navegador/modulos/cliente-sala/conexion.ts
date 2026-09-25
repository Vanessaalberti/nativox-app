import {
  esquemaMensajeSala,
  validar,
  type MensajeSala,
  type RolDeSala,
} from "@compartido/contratos";

export type EstadoDeConexion =
  "conectando" | "conectada" | "reconectando" | "reemplazada" | "cerrada";

export interface OpcionesDeSala {
  salaId: string;
  rol: RolDeSala;
  alMensaje: (mensaje: MensajeSala) => void;
  alCambiarConexion?: (estado: EstadoDeConexion) => void;
}

export interface ConexionSala {
  // Las líneas que no se pudieron mandar (sin conexión) quedan esperando y salen al reconectar; las
  // señales y los comandos, que envejecen, se descartan.
  enviar: (mensaje: MensajeSala) => void;
  cerrar: () => void;
}

const ESPERA_INICIAL_MS = 1000;
const ESPERA_MAXIMA_MS = 10_000;
// La sala cierra con este código cuando otra computadora toma su lugar.
const CODIGO_REEMPLAZADA = 4000;
const LINEAS_PENDIENTES_MAXIMAS = 300;
const SOCKET_ABIERTO = 1;

function direccionDeLaSala(salaId: string, rol: RolDeSala): string {
  const protocolo = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocolo}//${window.location.host}/api/salas/${salaId}/ws?rol=${rol}`;
}

export function conectarSala(opciones: OpcionesDeSala): ConexionSala {
  const { salaId, rol, alMensaje, alCambiarConexion } = opciones;
  const pendientes = new Map<string, MensajeSala>();
  let socket: WebSocket | null = null;
  let espera = ESPERA_INICIAL_MS;
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let cerrada = false;
  let primera = true;

  const avisar = (estado: EstadoDeConexion) => alCambiarConexion?.(estado);

  const abrir = () => {
    avisar(primera ? "conectando" : "reconectando");
    primera = false;
    const abierto = new WebSocket(direccionDeLaSala(salaId, rol));
    socket = abierto;

    abierto.addEventListener("open", () => {
      espera = ESPERA_INICIAL_MS;
      avisar("conectada");
      for (const mensaje of pendientes.values()) abierto.send(JSON.stringify(mensaje));
      pendientes.clear();
    });

    abierto.addEventListener("message", (evento: MessageEvent) => {
      if (typeof evento.data !== "string") return;
      let dato: unknown;
      try {
        dato = JSON.parse(evento.data);
      } catch {
        // Un mensaje roto se descarta, pero se deja constancia en la consola.
        // eslint-disable-next-line no-console
        console.warn("cliente-sala: mensaje que no es JSON, descartado");
        return;
      }
      const valido = validar(esquemaMensajeSala, dato);
      if (valido.ok) alMensaje(valido.valor);
      // eslint-disable-next-line no-console
      else console.warn(`cliente-sala: mensaje inválido descartado (${valido.motivo})`);
    });

    abierto.addEventListener("close", (evento: CloseEvent) => {
      if (socket === abierto) socket = null;
      if (cerrada) return;
      if (evento.code === CODIGO_REEMPLAZADA) {
        cerrada = true;
        avisar("reemplazada");
        return;
      }
      avisar("reconectando");
      temporizador = setTimeout(abrir, espera);
      espera = Math.min(espera * 2, ESPERA_MAXIMA_MS);
    });
  };

  abrir();

  return {
    enviar(mensaje) {
      if (socket?.readyState === SOCKET_ABIERTO) {
        socket.send(JSON.stringify(mensaje));
        return;
      }
      if (mensaje.tipo !== "linea") return;
      pendientes.set(mensaje.id, mensaje);
      // Sin conexión por mucho tiempo: se olvidan las más viejas.
      const [masVieja] = pendientes.keys();
      if (pendientes.size > LINEAS_PENDIENTES_MAXIMAS && masVieja !== undefined) {
        pendientes.delete(masVieja);
      }
    },
    cerrar() {
      cerrada = true;
      clearTimeout(temporizador);
      socket?.close(1000, "cerrada");
      avisar("cerrada");
    },
  };
}
