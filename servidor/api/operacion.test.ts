import { describe, expect, it } from "vitest";
import { ESTILO_POR_DEFECTO, type Charla, type Linea } from "@compartido/contratos";
import { generarToken, hashearToken } from "@servidor/modulos/cripto-acceso";
import { confirmarAccion, verAccion } from "./acciones";
import { crearCharla } from "./agenda";
import { pedido, usarCuentaConSalas } from "./contexto-de-prueba";
import { actualizarSalida, crearSalida } from "./produccion";
import { leerRegistroDeAire, leerTranscripcion } from "./transcripciones";

const entorno = usarCuentaConSalas();
const publico = (ruta: string) => pedido(ruta, undefined, undefined, "GET");

async function nuevoEnlace(
  accion: "reiniciar" | "pasar-a-la-nube" | "silenciar-avisos",
  venceEn = entorno.contexto.reloj + 15 * 60_000,
): Promise<string> {
  const token = generarToken();
  await entorno.contexto.operacion.crearAccion(
    await hashearToken(token),
    entorno.auditorio(),
    accion,
    venceEn,
  );
  return token;
}

describe("links de acción de los avisos", () => {
  it("abrir el link solo muestra qué va a pasar: no lo gasta ni ejecuta nada", async () => {
    const token = await nuevoEnlace("reiniciar");

    const vista = await verAccion(publico("/x"), entorno.contexto, token);
    const otraVez = await verAccion(publico("/x"), entorno.contexto, token);

    expect(await vista.json()).toEqual({ ok: true, accion: "reiniciar", sala: "Auditorio" });
    expect(otraVez.status).toBe(200);
    expect(entorno.contexto.tiempoReal.comandos).toEqual([]);
  });

  it("confirmarlo ejecuta la acción una sola vez y avisa al canal", async () => {
    await entorno.contexto.ajustes.guardar("webhook", "https://discord.com/api/webhooks/1/a");
    const token = await nuevoEnlace("reiniciar");

    const primera = await confirmarAccion(pedido("/x", {}), entorno.contexto, token);
    const segunda = await confirmarAccion(pedido("/x", {}), entorno.contexto, token);

    expect([primera.status, segunda.status]).toEqual([200, 404]);
    expect(entorno.contexto.tiempoReal.comandos).toEqual([
      { salaId: entorno.auditorio(), accion: "reiniciar" },
    ]);
    expect(entorno.contexto.avisos.enviados[0]?.texto).toContain("Auditorio");
  });

  it("un link vencido o inventado no sirve", async () => {
    const vencido = await nuevoEnlace("reiniciar", entorno.contexto.reloj - 1);

    const respuestas = await Promise.all([
      confirmarAccion(pedido("/x", {}), entorno.contexto, vencido),
      confirmarAccion(pedido("/x", {}), entorno.contexto, "a".repeat(64)),
      verAccion(publico("/x"), entorno.contexto, vencido),
    ]);

    expect(respuestas.map((respuesta) => respuesta.status)).toEqual([404, 404, 404]);
    expect(entorno.contexto.tiempoReal.comandos).toEqual([]);
  });

  it("reiniciar una sala sin computadora conectada lo dice; silenciar avisos sí se puede", async () => {
    entorno.contexto.tiempoReal.publicando = 0;
    const reiniciar = await nuevoEnlace("reiniciar");
    const silenciar = await nuevoEnlace("silenciar-avisos");

    const sinComputadora = await confirmarAccion(pedido("/x", {}), entorno.contexto, reiniciar);
    const silenciada = await confirmarAccion(pedido("/x", {}), entorno.contexto, silenciar);

    expect([sinComputadora.status, silenciada.status]).toEqual([409, 200]);
  });
});

describe("transcripción de una charla", () => {
  const linea = (id: string, original: string): Linea => ({
    tipo: "linea",
    id,
    original,
    traducciones: { en: `${original} (en)` },
    provisoria: false,
    inicio: 0,
    fin: 2,
  });

  async function charlaConTexto(): Promise<Charla> {
    const respuesta = await crearCharla(
      entorno.comoAdmin(`/api/salas/${entorno.auditorio()}/charlas`, {
        titulo: "Keynote",
        fecha: "2026-10-05",
        inicioMin: 600,
        finMin: 660,
      }),
      entorno.contexto,
      entorno.auditorio(),
    );
    const { charla } = (await respuesta.json()) as { charla: Charla };
    await entorno.contexto.operacion.guardarSegmento(
      entorno.auditorio(),
      charla.id,
      linea("a", "Hola"),
      1,
    );
    await entorno.contexto.operacion.guardarSegmento(
      entorno.auditorio(),
      null,
      linea("b", "Suelta"),
      2,
    );
    return charla;
  }

  it("devuelve lo que se dijo en la charla, con sus traducciones, y nada de lo demás", async () => {
    const charla = await charlaConTexto();

    const respuesta = await leerTranscripcion(
      entorno.comoAdmin("/x", undefined, "GET"),
      entorno.contexto,
      charla.id,
    );
    const { segmentos } = (await respuesta.json()) as { segmentos: { original: string }[] };

    expect(segmentos.map((segmento) => segmento.original)).toEqual(["Hola"]);
  });

  it("un operador la ve en sus salas y no en las ajenas; sin sesión, no", async () => {
    const charla = await charlaConTexto();
    const conSala = await entorno.cookieDeOperador([entorno.auditorio()]);
    const sinSala = await entorno.cookieDeOperador([entorno.sala2()]);

    const ver = (cookie?: string) =>
      leerTranscripcion(pedido("/x", undefined, cookie, "GET"), entorno.contexto, charla.id);

    expect([
      (await ver(conSala)).status,
      (await ver(sinSala)).status,
      (await ver()).status,
    ]).toEqual([200, 403, 401]);
    expect(
      (
        await leerTranscripcion(
          entorno.comoAdmin("/x", undefined, "GET"),
          entorno.contexto,
          "bbbbbbbbbbbb",
        )
      ).status,
    ).toBe(404);
  });
});

describe("registro de qué estuvo al aire", () => {
  it("anota cada cambio de sala en una salida, también el pasar a sin subtítulos, y no repite lo igual", async () => {
    const creada = await crearSalida(
      entorno.comoAdmin("/api/salidas", { nombre: "Programa" }),
      entorno.contexto,
    );
    const { salida } = (await creada.json()) as { salida: { numero: number } };
    const poner = async (salaAlAire: string | null) => {
      await actualizarSalida(
        entorno.comoAdmin(
          `/api/salidas/${String(salida.numero)}`,
          { nombre: "Programa", salaAlAire, estilo: ESTILO_POR_DEFECTO },
          "PUT",
        ),
        entorno.contexto,
        String(salida.numero),
      );
      entorno.contexto.reloj += 1000;
    };

    await poner(entorno.auditorio());
    await poner(entorno.auditorio());
    await poner(entorno.sala2());
    await poner(null);

    const respuesta = await leerRegistroDeAire(
      entorno.comoAdmin("/api/salidas/registro", undefined, "GET"),
      entorno.contexto,
    );
    const { entradas } = (await respuesta.json()) as { entradas: { sala: string | null }[] };

    expect(entradas.map((entrada) => entrada.sala)).toEqual([null, "Sala 2", "Auditorio"]);
  });

  it("solo el administrador lo ve", async () => {
    const respuesta = await leerRegistroDeAire(
      pedido("/x", undefined, undefined, "GET"),
      entorno.contexto,
    );

    expect(respuesta.status).toBe(401);
  });
});
