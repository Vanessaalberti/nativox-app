import { beforeEach, describe, expect, it } from "vitest";
import { AJUSTES_POR_DEFECTO, type Ajustes } from "@compartido/contratos";
import { cambiarContrasena, ingresar, nuevoCodigoDeRecuperacion, recuperar } from "./acceso";
import {
  esWebhookAceptado,
  guardarElWebhook,
  guardarLosAjustes,
  leerLosAjustes,
  leerPreferenciasDeSesion,
  probarElWebhook,
} from "./ajustes";
import {
  abrirCuenta,
  CONTRASENA_DE_PRUEBA,
  crearContextoDePrueba,
  pedido,
} from "./contexto-de-prueba";
import {
  actualizarEvento,
  crearEvento,
  eliminarEvento,
  leerEvento,
  responderEstado,
} from "./evento";
import { crearSalas } from "./salas";

const EVENTO = {
  tipo: "roles-separados",
  nombre: "DevConf Latam 2026",
  salasSimultaneas: 2,
  horasPorDia: 8,
  dias: 1,
  nubeComoRespaldo: false,
};
const WEBHOOK = "https://discord.com/api/webhooks/123/abc";

let contexto = crearContextoDePrueba();
let cookie = "";
let codigo = "";

beforeEach(async () => {
  contexto = crearContextoDePrueba();
  ({ cookie, codigo } = await abrirCuenta(contexto));
  await crearEvento(pedido("/api/evento", EVENTO, cookie), contexto);
});

const conSesion = (ruta: string, cuerpo?: unknown, metodo = "POST") =>
  pedido(ruta, cuerpo, cookie, metodo);

describe("ajustes", () => {
  it("sin nada guardado devuelve los valores por defecto y dice que no hay webhook", async () => {
    const respuesta = await leerLosAjustes(conSesion("/api/ajustes", undefined, "GET"), contexto);

    expect(await respuesta.json()).toEqual({
      ok: true,
      ajustes: AJUSTES_POR_DEFECTO,
      webhookConfigurado: false,
    });
  });

  it("guarda los ajustes y la nube como respaldo pasa al evento", async () => {
    const ajustes: Ajustes = {
      ...AJUSTES_POR_DEFECTO,
      nubeComoRespaldo: true,
      consumo: { ...AJUSTES_POR_DEFECTO.consumo, topeMensualUsd: 20, workersPaid: true },
    };

    const respuesta = await guardarLosAjustes(conSesion("/api/ajustes", ajustes, "PUT"), contexto);
    const leidos = (await (
      await leerLosAjustes(conSesion("/api/ajustes", undefined, "GET"), contexto)
    ).json()) as { ajustes: Ajustes };

    expect(respuesta.status).toBe(200);
    expect(leidos.ajustes).toEqual(ajustes);
    expect((await contexto.almacen.leerEvento())?.nubeComoRespaldo).toBe(true);
  });

  it("rechaza ajustes inválidos y a quien no es administrador", async () => {
    const malos = {
      ...AJUSTES_POR_DEFECTO,
      consumo: { ...AJUSTES_POR_DEFECTO.consumo, topeMensualUsd: -5 },
    };

    const invalido = await guardarLosAjustes(conSesion("/api/ajustes", malos, "PUT"), contexto);
    const sinSesion = await leerLosAjustes(
      pedido("/api/ajustes", undefined, undefined, "GET"),
      contexto,
    );

    expect([invalido.status, sinSesion.status]).toEqual([400, 401]);
  });
});

describe("webhook de avisos", () => {
  it("acepta canales conocidos y rechaza cualquier otro sitio", () => {
    expect(esWebhookAceptado(WEBHOOK)).toBe(true);
    expect(esWebhookAceptado("https://hooks.slack.com/services/T000/B000/xyz")).toBe(true);
    expect(esWebhookAceptado("https://chat.googleapis.com/v1/spaces/AAA/messages?key=1")).toBe(
      true,
    );
    expect(esWebhookAceptado("http://discord.com/api/webhooks/1/a")).toBe(false);
    expect(esWebhookAceptado("https://discord.com.malo.com/api/webhooks/1/a")).toBe(false);
    expect(esWebhookAceptado("https://discord.com/otra-ruta")).toBe(false);
    expect(esWebhookAceptado("https://169.254.169.254/api/webhooks/1")).toBe(false);
    expect(esWebhookAceptado("no es una url")).toBe(false);
  });

  it("se guarda sin devolver nunca la dirección, y se puede borrar", async () => {
    const guardado = await guardarElWebhook(
      conSesion("/api/ajustes/webhook", { url: WEBHOOK }, "PUT"),
      contexto,
    );
    const texto = JSON.stringify(await guardado.json());
    const leido = JSON.stringify(
      await (await leerLosAjustes(conSesion("/api/ajustes", undefined, "GET"), contexto)).json(),
    );

    expect(texto).toContain('"webhookConfigurado":true');
    expect(texto + leido).not.toContain("webhooks/123");

    await guardarElWebhook(conSesion("/api/ajustes/webhook", { url: null }, "PUT"), contexto);
    expect(await contexto.ajustes.leer("webhook")).toBeNull();
  });

  it("no guarda una dirección que no es de un canal conocido", async () => {
    const respuesta = await guardarElWebhook(
      conSesion("/api/ajustes/webhook", { url: "https://malo.example.com/hook" }, "PUT"),
      contexto,
    );

    expect(respuesta.status).toBe(400);
    expect(await contexto.ajustes.leer("webhook")).toBeNull();
  });

  it("probar manda un mensaje al canal y avisa si no llegó", async () => {
    const sinWebhook = await probarElWebhook(
      conSesion("/api/ajustes/webhook/probar", {}),
      contexto,
    );
    await guardarElWebhook(conSesion("/api/ajustes/webhook", { url: WEBHOOK }, "PUT"), contexto);

    const llego = await probarElWebhook(conSesion("/api/ajustes/webhook/probar", {}), contexto);
    contexto.avisos.llegan = false;
    const noLlego = await probarElWebhook(conSesion("/api/ajustes/webhook/probar", {}), contexto);

    expect([sinWebhook.status, llego.status, noLlego.status]).toEqual([409, 200, 502]);
    expect(contexto.avisos.enviados[0]).toMatchObject({ direccion: WEBHOOK });
    expect(contexto.avisos.enviados[0]?.texto).toContain("DevConf Latam 2026");
  });
});

describe("cuenta", () => {
  it("cambia la contraseña con la actual; la vieja deja de servir", async () => {
    const respuesta = await cambiarContrasena(
      conSesion("/api/acceso/contrasena", {
        actual: CONTRASENA_DE_PRUEBA,
        nueva: "otra frase bien larga",
      }),
      contexto,
    );
    const conLaVieja = await ingresar(
      pedido("/api/acceso/ingresar", {
        email: "vos@tuevento.com",
        contrasena: CONTRASENA_DE_PRUEBA,
      }),
      contexto,
    );
    const conLaNueva = await ingresar(
      pedido("/api/acceso/ingresar", {
        email: "vos@tuevento.com",
        contrasena: "otra frase bien larga",
      }),
      contexto,
    );

    expect([respuesta.status, conLaVieja.status, conLaNueva.status]).toEqual([200, 401, 200]);
  });

  it("rechaza si la contraseña actual es incorrecta y frena los intentos en cadena", async () => {
    const intento = () =>
      cambiarContrasena(
        conSesion("/api/acceso/contrasena", {
          actual: "incorrecta larga",
          nueva: "otra frase bien larga",
        }),
        contexto,
      );

    const primero = await intento();
    for (let i = 0; i < 7; i += 1) await intento();
    const bloqueado = await intento();

    expect([primero.status, bloqueado.status]).toEqual([401, 429]);
  });

  it("un código de recuperación nuevo reemplaza al anterior", async () => {
    const respuesta = await nuevoCodigoDeRecuperacion(
      conSesion("/api/acceso/codigo-de-recuperacion", { contrasena: CONTRASENA_DE_PRUEBA }),
      contexto,
    );
    const { codigoRecuperacion } = (await respuesta.json()) as { codigoRecuperacion: string };
    const conElViejo = await recuperar(
      pedido("/api/acceso/recuperar", {
        email: "vos@tuevento.com",
        codigo,
        contrasenaNueva: "una frase nueva larga",
      }),
      contexto,
    );
    const conElNuevo = await recuperar(
      pedido("/api/acceso/recuperar", {
        email: "vos@tuevento.com",
        codigo: codigoRecuperacion,
        contrasenaNueva: "una frase nueva larga",
      }),
      contexto,
    );

    expect([respuesta.status, conElViejo.status, conElNuevo.status]).toEqual([200, 401, 200]);
  });

  it("pedir un código nuevo exige la contraseña", async () => {
    const respuesta = await nuevoCodigoDeRecuperacion(
      conSesion("/api/acceso/codigo-de-recuperacion", { contrasena: "incorrecta larga" }),
      contexto,
    );

    expect(respuesta.status).toBe(401);
  });
});

describe("evento", () => {
  it("cambia el nombre, el logo y las fechas", async () => {
    const respuesta = await actualizarEvento(
      conSesion(
        "/api/evento",
        { nombre: "Otro nombre", logo: null, fechaInicio: "2026-10-05", fechaFin: "2026-10-07" },
        "PUT",
      ),
      contexto,
    );
    const leido = (await (
      await leerEvento(conSesion("/api/evento", undefined, "GET"), contexto)
    ).json()) as { evento: { nombre: string; fechaFin: string } };

    expect(respuesta.status).toBe(200);
    expect(leido.evento).toMatchObject({ nombre: "Otro nombre", fechaFin: "2026-10-07" });
  });

  it("rechaza fechas al revés y logos que no son imágenes", async () => {
    const alReves = await actualizarEvento(
      conSesion(
        "/api/evento",
        { nombre: "X", logo: null, fechaInicio: "2026-10-07", fechaFin: "2026-10-05" },
        "PUT",
      ),
      contexto,
    );
    const logoMalo = await actualizarEvento(
      conSesion(
        "/api/evento",
        {
          nombre: "X",
          logo: "data:text/html;base64,PHNjcmlwdD4=",
          fechaInicio: null,
          fechaFin: null,
        },
        "PUT",
      ),
      contexto,
    );

    expect([alReves.status, logoMalo.status]).toEqual([400, 400]);
  });

  it("eliminarlo pide escribir el nombre y borra todo, incluida la cuenta", async () => {
    await crearSalas(
      pedido(
        "/api/salas",
        { salas: [{ nombre: "Auditorio", idiomaOriginal: "es", idiomasDestino: [] }] },
        cookie,
      ),
      contexto,
    );
    await guardarElWebhook(conSesion("/api/ajustes/webhook", { url: WEBHOOK }, "PUT"), contexto);

    const incorrecto = await eliminarEvento(
      conSesion("/api/evento", { nombre: "otro" }, "DELETE"),
      contexto,
    );
    expect(await contexto.agenda.listarSalas()).toHaveLength(1);

    const correcto = await eliminarEvento(
      conSesion("/api/evento", { nombre: "DevConf Latam 2026" }, "DELETE"),
      contexto,
    );
    const estado = (await (
      await responderEstado(pedido("/api/estado", undefined, undefined, "GET"), contexto)
    ).json()) as { hayAdministrador: boolean; hayEvento: boolean };

    expect([incorrecto.status, correcto.status]).toEqual([400, 200]);
    expect(estado).toMatchObject({ hayAdministrador: false, hayEvento: false });
    expect(await contexto.agenda.listarSalas()).toEqual([]);
    expect(await contexto.ajustes.leer("webhook")).toBeNull();
  });
});

describe("preferencias de la sesión en vivo", () => {
  it("las ve cualquiera con sesión (el operador también), solo las que aplica la computadora, y sin sesión no", async () => {
    await guardarLosAjustes(
      conSesion(
        "/api/ajustes",
        {
          ...AJUSTES_POR_DEFECTO,
          operacion: { ...AJUSTES_POR_DEFECTO.operacion, autorreparacion: false },
        },
        "PUT",
      ),
      contexto,
    );

    const conCuenta = await leerPreferenciasDeSesion(
      conSesion("/api/sesion/preferencias", undefined, "GET"),
      contexto,
    );
    const sinCuenta = await leerPreferenciasDeSesion(
      pedido("/api/sesion/preferencias", undefined, undefined, "GET"),
      contexto,
    );

    expect(await conCuenta.json()).toEqual({
      ok: true,
      autorreparacion: false,
      arranqueConAgenda: true,
      corregirLineaAnterior: true,
    });
    expect(sinCuenta.status).toBe(401);
  });
});
