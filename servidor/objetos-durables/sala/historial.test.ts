import { describe, expect, it } from "vitest";
import { estaEnVivo, VIGENCIA_DE_LA_SENAL_MS } from "./historial";

describe("estaEnVivo", () => {
  it("hace falta alguien publicando y una señal reciente", () => {
    expect(estaEnVivo(1, 1000, 1000 + VIGENCIA_DE_LA_SENAL_MS)).toBe(true);
    expect(estaEnVivo(1, 1000, 1001 + VIGENCIA_DE_LA_SENAL_MS)).toBe(false);
    expect(estaEnVivo(0, 1000, 1000)).toBe(false);
    expect(estaEnVivo(1, null, 1000)).toBe(false);
  });
});
