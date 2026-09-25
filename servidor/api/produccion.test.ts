import { describe, expect, it } from "vitest";
import {
  ESTILO_POR_DEFECTO,
  type SalidaDeProduccion,
  type Transmision,
} from "@compartido/contratos";
import { pedido, usarCuentaConSalas } from "./contexto-de-prueba";
import {
  actualizarSalida,
  borrarSalida,
  crearSalida,
  guardarEstiloDeSala,
  listarSalidas,
  responderSalidaPublica,
  responderTransmisionDeSala,
} from "./produccion";

const entorno = usarCuentaConSalas();

async function nuevaSalida(nombre = "Programa"): Promise<SalidaDeProduccion> {
  const respuesta = await crearSalida(
    entorno.comoAdmin("/api/salidas", { nombre }),
    entorno.contexto,
  );
  return ((await respuesta.json()) as { salida: SalidaDeProduccion }).salida;
}

describe("salidas de producción", () => {
  it("crea salidas con número correlativo, sin sala al aire y con el estilo por defecto", async () => {
    const primera = await nuevaSalida("Programa");
    const segunda = await nuevaSalida("Pantalla lateral");

    expect([primera.numero, segunda.numero]).toEqual([1, 2]);
    expect(primera).toMatchObject({
      nombre: "Programa",
      salaAlAire: null,
      estilo: ESTILO_POR_DEFECTO,
    });
  });

  it("pone una sala al aire y cambia el estilo; la página pública lo ve al instante", async () => {
    const salida = await nuevaSalida();
    const estilo = { ...ESTILO_POR_DEFECTO, idioma: "en", lineas: 3, posicion: "arriba" };

    const respuesta = await actualizarSalida(
      entorno.comoAdmin(
        `/api/salidas/${String(salida.numero)}`,
        { nombre: "Programa", salaAlAire: entorno.auditorio(), estilo },
        "PUT",
      ),
      entorno.contexto,
      String(salida.numero),
    );
    const publica = (await (
      await responderSalidaPublica(
        pedido("/x", undefined, undefined, "GET"),
        entorno.contexto,
        String(salida.numero),
      )
    ).json()) as Transmision;

    expect(respuesta.status).toBe(200);
    expect(publica.sala).toMatchObject({
      id: entorno.auditorio(),
      nombre: "Auditorio",
      idiomasDestino: ["en"],
    });
    expect(publica.estilo).toMatchObject({ idioma: "en", lineas: 3, posicion: "arriba" });
  });

  it('una salida sin sala al aire lo dice: la página muestra "sin subtítulos"', async () => {
    const salida = await nuevaSalida();

    const publica = (await (
      await responderSalidaPublica(
        pedido("/x", undefined, undefined, "GET"),
        entorno.contexto,
        String(salida.numero),
      )
    ).json()) as Transmision;

    expect(publica.sala).toBeNull();
  });

  it("rechaza una sala que no existe, un estilo inválido y una salida inexistente", async () => {
    const salida = await nuevaSalida();
    const enviar = (numero: string, cuerpo: unknown) =>
      actualizarSalida(
        entorno.comoAdmin(`/api/salidas/${numero}`, cuerpo, "PUT"),
        entorno.contexto,
        numero,
      );

    const sinSala = await enviar(String(salida.numero), {
      nombre: "P",
      salaAlAire: "aaaaaaaaaaaa",
      estilo: ESTILO_POR_DEFECTO,
    });
    const estiloMalo = await enviar(String(salida.numero), {
      nombre: "P",
      salaAlAire: null,
      estilo: { ...ESTILO_POR_DEFECTO, lineas: 9 },
    });
    const inexistente = await enviar("99", {
      nombre: "P",
      salaAlAire: null,
      estilo: ESTILO_POR_DEFECTO,
    });

    expect([sinSala.status, estiloMalo.status, inexistente.status]).toEqual([404, 400, 404]);
  });

  it("solo el administrador las maneja", async () => {
    const salida = await nuevaSalida();

    const respuestas = await Promise.all([
      listarSalidas(pedido("/api/salidas", undefined, undefined, "GET"), entorno.contexto),
      crearSalida(pedido("/api/salidas", { nombre: "X" }), entorno.contexto),
      borrarSalida(
        pedido("/x", undefined, undefined, "DELETE"),
        entorno.contexto,
        String(salida.numero),
      ),
    ]);

    expect(respuestas.map((respuesta) => respuesta.status)).toEqual([401, 401, 401]);
    expect(await entorno.contexto.produccion.listarSalidas()).toHaveLength(1);
  });

  it("elimina una salida", async () => {
    const salida = await nuevaSalida();

    const respuesta = await borrarSalida(
      entorno.comoAdmin(`/api/salidas/${String(salida.numero)}`, undefined, "DELETE"),
      entorno.contexto,
      String(salida.numero),
    );

    expect(respuesta.status).toBe(200);
    expect(await entorno.contexto.produccion.listarSalidas()).toEqual([]);
  });
});

describe("estilo del link de una sala", () => {
  it("se guarda por sala y la página pública lo usa; sin estilo propio, el de por defecto", async () => {
    const estilo = { ...ESTILO_POR_DEFECTO, tamanoLetra: 80, mostrarOriginal: true };

    const guardado = await guardarEstiloDeSala(
      entorno.comoAdmin(`/api/salas/${entorno.auditorio()}/estilo`, estilo, "PUT"),
      entorno.contexto,
      entorno.auditorio(),
    );
    const conEstilo = (await (
      await responderTransmisionDeSala(
        pedido("/x", undefined, undefined, "GET"),
        entorno.contexto,
        entorno.auditorio(),
      )
    ).json()) as Transmision;
    const sinEstilo = (await (
      await responderTransmisionDeSala(
        pedido("/x", undefined, undefined, "GET"),
        entorno.contexto,
        entorno.sala2(),
      )
    ).json()) as Transmision;

    expect(guardado.status).toBe(200);
    expect(conEstilo.estilo).toMatchObject({ tamanoLetra: 80, mostrarOriginal: true });
    expect(sinEstilo.estilo).toEqual(ESTILO_POR_DEFECTO);
  });

  it("un operador la cambia en sus salas y no en las ajenas", async () => {
    const cookie = await entorno.cookieDeOperador([entorno.auditorio()]);

    const propia = await guardarEstiloDeSala(
      pedido(`/api/salas/${entorno.auditorio()}/estilo`, ESTILO_POR_DEFECTO, cookie, "PUT"),
      entorno.contexto,
      entorno.auditorio(),
    );
    const ajena = await guardarEstiloDeSala(
      pedido(`/api/salas/${entorno.sala2()}/estilo`, ESTILO_POR_DEFECTO, cookie, "PUT"),
      entorno.contexto,
      entorno.sala2(),
    );

    expect([propia.status, ajena.status]).toEqual([200, 403]);
  });
});
