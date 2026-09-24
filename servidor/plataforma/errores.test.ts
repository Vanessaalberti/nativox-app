import { describe, expect, it } from "vitest";
import { responderError } from "./errores";

describe("responderError", () => {
  it("usa el estado pedido y el formato común de error", async () => {
    const respuesta = responderError(404, "ruta_inexistente", "No existe la ruta /api/x");

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({
      ok: false,
      error: { codigo: "ruta_inexistente", mensaje: "No existe la ruta /api/x" },
    });
  });
});
