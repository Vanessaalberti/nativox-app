import { describe, expect, it } from "vitest";
import { responderSalud } from "./salud";

describe("responderSalud", () => {
  it("responde 200 con el nombre del servicio", async () => {
    const respuesta = responderSalud();

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ ok: true, servicio: "nativox" });
  });
});
