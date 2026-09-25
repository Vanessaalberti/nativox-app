import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Linea } from "@compartido/contratos";
import { conectarSala, type EstadoDeConexion } from "./index";

// Un WebSocket de mentira: guarda lo que se manda y deja simular lo que llega y los cierres.
class SocketFalso {
  static instancias: SocketFalso[] = [];
  readyState = 0;
  enviados: string[] = [];
  private oyentes = new Map<string, ((evento: unknown) => void)[]>();

  readonly url: string;

  constructor(url: string) {
    this.url = url;
    SocketFalso.instancias.push(this);
  }

  addEventListener(tipo: string, oyente: (evento: unknown) => void) {
    this.oyentes.set(tipo, [...(this.oyentes.get(tipo) ?? []), oyente]);
  }
  send(texto: string) {
    this.enviados.push(texto);
  }
  close() {
    this.readyState = 3;
  }
  emitir(tipo: string, evento: unknown = {}) {
    if (tipo === "open") this.readyState = 1;
    for (const oyente of this.oyentes.get(tipo) ?? []) oyente(evento);
  }
}

const linea = (id: string, original: string): Linea => ({
  tipo: "linea",
  id,
  original,
  traducciones: {},
  provisoria: false,
  inicio: 0,
  fin: 1,
});

const senal = { tipo: "senal", estado: "en-vivo", nivelAudio: 0.5, latenciaMs: 10 } as const;

const ultimo = () => SocketFalso.instancias[SocketFalso.instancias.length - 1] as SocketFalso;

beforeEach(() => {
  vi.useFakeTimers();
  SocketFalso.instancias = [];
  vi.stubGlobal("WebSocket", SocketFalso);
  vi.stubGlobal("window", { location: { protocol: "https:", host: "nativox.test" } });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("conectarSala", () => {
  it("se conecta a la sala con el rol pedido", () => {
    conectarSala({ salaId: "abc", rol: "espectador", alMensaje: vi.fn() });

    expect(ultimo().url).toBe("wss://nativox.test/api/salas/abc/ws?rol=espectador");
  });

  it("entrega los mensajes válidos y descarta los inválidos", () => {
    const alMensaje = vi.fn();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    conectarSala({ salaId: "abc", rol: "espectador", alMensaje });
    ultimo().emitir("open");

    ultimo().emitir("message", { data: JSON.stringify(linea("1", "hola")) });
    ultimo().emitir("message", { data: JSON.stringify({ tipo: "otra-cosa" }) });
    ultimo().emitir("message", { data: "no es json" });

    expect(alMensaje).toHaveBeenCalledTimes(1);
    expect(alMensaje).toHaveBeenCalledWith(linea("1", "hola"));
  });

  it("si se cae, se reconecta con espera creciente", () => {
    const estados: EstadoDeConexion[] = [];
    conectarSala({
      salaId: "abc",
      rol: "espectador",
      alMensaje: vi.fn(),
      alCambiarConexion: (estado) => estados.push(estado),
    });
    ultimo().emitir("open");

    ultimo().emitir("close", { code: 1006 });
    vi.advanceTimersByTime(999);
    expect(SocketFalso.instancias).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(SocketFalso.instancias).toHaveLength(2);

    ultimo().emitir("close", { code: 1006 });
    vi.advanceTimersByTime(1999);
    expect(SocketFalso.instancias).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(SocketFalso.instancias).toHaveLength(3);
    expect(estados[0]).toBe("conectando");
    expect(estados).toContain("reconectando");
  });

  it("las líneas que no se pudieron mandar salen al reconectar, una sola vez por id", () => {
    const conexion = conectarSala({ salaId: "abc", rol: "publicador", alMensaje: vi.fn() });
    conexion.enviar(linea("1", "hola mu"));
    conexion.enviar(linea("1", "hola mundo"));
    conexion.enviar(linea("2", "chau"));
    conexion.enviar(senal);

    ultimo().emitir("open");

    expect(ultimo().enviados.map((texto) => (JSON.parse(texto) as Linea).original)).toEqual([
      "hola mundo",
      "chau",
    ]);
  });

  it("estando conectada manda en el momento", () => {
    const conexion = conectarSala({ salaId: "abc", rol: "publicador", alMensaje: vi.fn() });
    ultimo().emitir("open");

    conexion.enviar(senal);

    expect(ultimo().enviados).toHaveLength(1);
  });

  it("si otra computadora tomó la sala, no se reconecta", () => {
    const estados: EstadoDeConexion[] = [];
    conectarSala({
      salaId: "abc",
      rol: "publicador",
      alMensaje: vi.fn(),
      alCambiarConexion: (estado) => estados.push(estado),
    });
    ultimo().emitir("open");

    ultimo().emitir("close", { code: 4000 });
    vi.advanceTimersByTime(60_000);

    expect(SocketFalso.instancias).toHaveLength(1);
    expect(estados.at(-1)).toBe("reemplazada");
  });

  it("al cerrarla a propósito no se reconecta", () => {
    const conexion = conectarSala({ salaId: "abc", rol: "espectador", alMensaje: vi.fn() });
    ultimo().emitir("open");

    conexion.cerrar();
    ultimo().emitir("close", { code: 1000 });
    vi.advanceTimersByTime(60_000);

    expect(SocketFalso.instancias).toHaveLength(1);
  });
});
