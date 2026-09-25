import { describe, expect, it } from "vitest";
import { validarWav, wavDeSilencio } from "./index";

describe("validarWav", () => {
  it("acepta un WAV de 16 kHz dentro del límite y dice cuánto dura", () => {
    expect(validarWav(wavDeSilencio(8), 10)).toEqual({ ok: true, valor: { segundos: 8 } });
  });

  it("rechaza lo que pasa del límite", () => {
    expect(validarWav(wavDeSilencio(14), 10).ok).toBe(false);
  });

  it("rechaza otra frecuencia o algo que no es WAV", () => {
    expect(validarWav(wavDeSilencio(5, 44_100), 10).ok).toBe(false);
    expect(validarWav(new Uint8Array(100), 10).ok).toBe(false);
  });
});
