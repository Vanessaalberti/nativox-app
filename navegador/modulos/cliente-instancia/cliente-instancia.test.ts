import { afterEach, describe, expect, it, vi } from "vitest";
import { crearCuenta, ingresar, leerEstado } from "./index";

afterEach(() => {
  vi.unstubAllGlobals();
});

function responder(cuerpo: unknown, estado = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado })),
  );
}

describe("cliente-instancia", () => {
  it("devuelve el código de recuperación al crear la cuenta", async () => {
    responder({ ok: true, codigoRecuperacion: "ABCD-EFGH-JKMN-PQRS" }, 201);

    const respuesta = await crearCuenta({
      email: "vos@tuevento.com",
      contrasena: "una frase bien larga",
    });

    expect(respuesta).toEqual({ ok: true, valor: { codigo: "ABCD-EFGH-JKMN-PQRS" } });
  });

  it("muestra el mensaje del servidor cuando rechaza", async () => {
    responder(
      { ok: false, error: { codigo: "credenciales_invalidas", mensaje: "No coincide." } },
      401,
    );

    const respuesta = await ingresar({ email: "vos@tuevento.com", contrasena: "x" });

    expect(respuesta).toEqual({ ok: false, motivo: "No coincide." });
  });

  it("sin conexión da un mensaje, no una excepción", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const respuesta = await leerEstado();

    expect(respuesta.ok).toBe(false);
  });

  it("una respuesta que no es JSON también da un mensaje", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 502 })));

    const respuesta = await leerEstado();

    expect(respuesta).toEqual({ ok: false, motivo: "Respuesta inesperada del servidor (502)." });
  });

  it("una respuesta con otra forma se rechaza en vez de usarse", async () => {
    responder({ ok: true, algo: "distinto" });

    expect((await leerEstado()).ok).toBe(false);
  });
});
