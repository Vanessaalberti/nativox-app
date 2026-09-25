import { beforeEach, describe, expect, it } from "vitest";
import { crearCuenta, ingresar, ingresarOperador, recuperar, salir } from "./acceso";
import {
  abrirCuenta as abrirCuentaDePrueba,
  CONTRASENA_DE_PRUEBA as CONTRASENA,
  crearContextoDePrueba,
  pedido,
} from "./contexto-de-prueba";
import { crearEvento, leerEvento, responderEstado } from "./evento";

const EVENTO = {
  tipo: "todo-en-uno",
  nombre: "DevConf Latam 2026",
  salasSimultaneas: 2,
  horasPorDia: 8,
  dias: 1,
  nubeComoRespaldo: false,
};

let contexto = crearContextoDePrueba();

beforeEach(() => {
  contexto = crearContextoDePrueba();
});

const abrirCuenta = () => abrirCuentaDePrueba(contexto);

describe("crear cuenta", () => {
  it("crea al administrador, abre la sesión y entrega el código una sola vez", async () => {
    const respuesta = await crearCuenta(
      pedido("/api/acceso/cuenta", { email: "vos@tuevento.com", contrasena: CONTRASENA }),
      contexto,
    );

    expect(respuesta.status).toBe(201);
    const cuerpo = (await respuesta.json()) as { ok: boolean; codigoRecuperacion: string };
    expect(cuerpo.codigoRecuperacion).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    const cookie = respuesta.headers.get("Set-Cookie") ?? "";
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Secure/);
  });

  it("no guarda la contraseña ni el código: solo sus hashes", async () => {
    const { codigo } = await abrirCuenta();
    const administrador = await contexto.almacen.leerAdministrador();

    expect(administrador?.email).toBe("vos@tuevento.com");
    expect(JSON.stringify(administrador)).not.toContain(CONTRASENA);
    expect(JSON.stringify(administrador)).not.toContain(codigo);
  });

  it("la segunda persona en llegar no puede crear otra cuenta", async () => {
    await abrirCuenta();
    const respuesta = await crearCuenta(
      pedido("/api/acceso/cuenta", { email: "otra@persona.com", contrasena: CONTRASENA }),
      contexto,
    );

    expect(respuesta.status).toBe(409);
  });

  it("rechaza contraseñas cortas, emails inválidos y pedidos que no son JSON", async () => {
    const corta = await crearCuenta(
      pedido("/api/acceso/cuenta", { email: "vos@tuevento.com", contrasena: "corta" }),
      contexto,
    );
    const sinArroba = await crearCuenta(
      pedido("/api/acceso/cuenta", { email: "vos", contrasena: CONTRASENA }),
      contexto,
    );
    const formulario = await crearCuenta(
      new Request("https://nativox.test/api/acceso/cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "email=a@b.c&contrasena=x",
      }),
      contexto,
    );

    expect([corta.status, sinArroba.status, formulario.status]).toEqual([400, 400, 400]);
    expect(await contexto.almacen.leerAdministrador()).toBeNull();
  });

  it("en http (desarrollo) la cookie no lleva Secure", async () => {
    contexto.segura = false;
    const respuesta = await crearCuenta(
      pedido("/api/acceso/cuenta", { email: "vos@tuevento.com", contrasena: CONTRASENA }),
      contexto,
    );

    expect(respuesta.headers.get("Set-Cookie")).not.toMatch(/Secure/);
  });
});

describe("ingresar", () => {
  it("entra con el email (sin importar mayúsculas) y la contraseña", async () => {
    await abrirCuenta();
    const respuesta = await ingresar(
      pedido("/api/acceso/ingresar", { email: " VOS@tuevento.com ", contrasena: CONTRASENA }),
      contexto,
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("Set-Cookie")).toMatch(/nativox_sesion=[0-9a-f]{64}/);
  });

  it("no distingue email inexistente de contraseña incorrecta", async () => {
    await abrirCuenta();
    const otroEmail = await ingresar(
      pedido("/api/acceso/ingresar", { email: "otra@persona.com", contrasena: CONTRASENA }),
      contexto,
    );
    const otraContrasena = await ingresar(
      pedido("/api/acceso/ingresar", { email: "vos@tuevento.com", contrasena: "incorrecta" }),
      contexto,
    );

    expect(otroEmail.status).toBe(401);
    expect(otraContrasena.status).toBe(401);
    expect(await otroEmail.json()).toEqual(await otraContrasena.json());
  });

  it("después de 8 intentos fallidos frena, aunque la contraseña sea la correcta", async () => {
    await abrirCuenta();
    const intento = (contrasena: string) =>
      ingresar(pedido("/api/acceso/ingresar", { email: "vos@tuevento.com", contrasena }), contexto);

    for (let i = 0; i < 8; i += 1) await intento("incorrecta");
    const bloqueado = await intento(CONTRASENA);
    contexto.reloj += 16 * 60 * 1000;
    const pasadoElTiempo = await intento(CONTRASENA);

    expect(bloqueado.status).toBe(429);
    expect(pasadoElTiempo.status).toBe(200);
  });
});

describe("recuperar", () => {
  it("cambia la contraseña con el código, lo invalida y cierra las sesiones viejas", async () => {
    const { cookie, codigo } = await abrirCuenta();
    const respuesta = await recuperar(
      pedido("/api/acceso/recuperar", {
        email: "vos@tuevento.com",
        codigo: codigo.toLowerCase().replaceAll("-", " "),
        contrasenaNueva: "otra contraseña larga",
      }),
      contexto,
    );
    const cuerpo = (await respuesta.json()) as { codigoRecuperacion: string };
    const conLaVieja = await ingresar(
      pedido("/api/acceso/ingresar", { email: "vos@tuevento.com", contrasena: CONTRASENA }),
      contexto,
    );
    const conLaNueva = await ingresar(
      pedido("/api/acceso/ingresar", {
        email: "vos@tuevento.com",
        contrasena: "otra contraseña larga",
      }),
      contexto,
    );
    const conElCodigoViejo = await recuperar(
      pedido("/api/acceso/recuperar", {
        email: "vos@tuevento.com",
        codigo,
        contrasenaNueva: "una tercera contraseña",
      }),
      contexto,
    );
    const estado = (await (
      await responderEstado(pedido("/api/estado", undefined, cookie, "GET"), contexto)
    ).json()) as { sesion: unknown };

    expect(respuesta.status).toBe(200);
    expect(cuerpo.codigoRecuperacion).not.toBe(codigo);
    expect(conLaVieja.status).toBe(401);
    expect(conLaNueva.status).toBe(200);
    expect(conElCodigoViejo.status).toBe(401);
    expect(estado.sesion).toBeNull();
  });

  it("rechaza un código incorrecto y frena los intentos en cadena", async () => {
    await abrirCuenta();
    const intento = () =>
      recuperar(
        pedido("/api/acceso/recuperar", {
          email: "vos@tuevento.com",
          codigo: "AAAA-BBBB-CCCC-DDDD",
          contrasenaNueva: "otra contraseña larga",
        }),
        contexto,
      );

    const primero = await intento();
    for (let i = 0; i < 7; i += 1) await intento();
    const bloqueado = await intento();

    expect(primero.status).toBe(401);
    expect(bloqueado.status).toBe(429);
  });
});

describe("sesión y evento", () => {
  const datos = (cookie: string) => pedido("/api/evento", EVENTO, cookie);

  it("el estado dice qué falta y quién pregunta", async () => {
    const vacio = (await (
      await responderEstado(pedido("/api/estado", undefined, undefined, "GET"), contexto)
    ).json()) as Record<string, unknown>;
    const { cookie } = await abrirCuenta();
    const conCuenta = (await (
      await responderEstado(pedido("/api/estado", undefined, cookie, "GET"), contexto)
    ).json()) as Record<string, unknown>;

    expect(vacio).toMatchObject({ hayAdministrador: false, hayEvento: false, sesion: null });
    expect(conCuenta).toMatchObject({
      hayAdministrador: true,
      hayEvento: false,
      sesion: { rol: "administrador" },
    });
  });

  it("crea el evento una sola vez y solo con sesión de administrador", async () => {
    const { cookie } = await abrirCuenta();
    const sinSesion = await crearEvento(pedido("/api/evento", EVENTO), contexto);
    const primero = await crearEvento(datos(cookie), contexto);
    const segundo = await crearEvento(datos(cookie), contexto);

    expect(sinSesion.status).toBe(401);
    expect(primero.status).toBe(201);
    expect(segundo.status).toBe(409);
  });

  it("valida el evento: nombre, fechas y límites de la estimación", async () => {
    const { cookie } = await abrirCuenta();
    const invalidos = [
      { ...EVENTO, nombre: "   " },
      { ...EVENTO, salasSimultaneas: 0 },
      { ...EVENTO, dias: 15 },
      { ...EVENTO, fechaInicio: "2026-10-05", fechaFin: "2026-10-01" },
      { ...EVENTO, logo: "data:text/html;base64,PHNjcmlwdD4=" },
    ];

    for (const invalido of invalidos) {
      const respuesta = await crearEvento(pedido("/api/evento", invalido, cookie), contexto);
      expect(respuesta.status).toBe(400);
    }
    expect(await contexto.almacen.leerEvento()).toBeNull();
  });

  it("el administrador lee su evento con su email; sin sesión, no", async () => {
    const { cookie } = await abrirCuenta();
    await crearEvento(datos(cookie), contexto);

    const propio = await leerEvento(pedido("/api/evento", undefined, cookie, "GET"), contexto);
    const ajeno = await leerEvento(pedido("/api/evento", undefined, undefined, "GET"), contexto);

    expect(await propio.json()).toMatchObject({
      ok: true,
      email: "vos@tuevento.com",
      evento: { nombre: "DevConf Latam 2026", tipo: "todo-en-uno" },
    });
    expect(ajeno.status).toBe(401);
  });

  it("salir cierra la sesión", async () => {
    const { cookie } = await abrirCuenta();
    const respuesta = await salir(pedido("/api/acceso/salir", {}, cookie), contexto);
    const despues = await leerEvento(pedido("/api/evento", undefined, cookie, "GET"), contexto);

    expect(respuesta.headers.get("Set-Cookie")).toMatch(/Max-Age=0/);
    expect(despues.status).toBe(401);
  });

  it("una sesión vencida no sirve", async () => {
    const { cookie } = await abrirCuenta();
    contexto.reloj += 31 * 24 * 60 * 60 * 1000;

    const respuesta = await leerEvento(pedido("/api/evento", undefined, cookie, "GET"), contexto);

    expect(respuesta.status).toBe(401);
  });
});

describe("operador", () => {
  it("todavía no hay invitaciones: cualquier código se rechaza", async () => {
    const respuesta = await ingresarOperador(
      pedido("/api/acceso/operador", { codigo: "NTVX-7K2P" }),
      contexto,
    );

    expect(respuesta.status).toBe(401);
  });
});
