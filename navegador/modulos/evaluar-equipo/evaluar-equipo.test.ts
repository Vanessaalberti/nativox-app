import { describe, expect, it } from "vitest";
import {
  estimarPasada,
  pasadaProvisoriaDelNivel,
  recomendar,
  type Equipo,
  type Medidas,
} from "./index";

const conF16: Equipo = {
  webgpu: true,
  f16: true,
  placa: "Intel Iris Xe",
  memoriaGb: 8,
  nucleos: 8,
  bufferMaximoMb: 4096,
};
const sinF16: Equipo = { ...conF16, f16: false, placa: "AMD Radeon RX 480" };
const sinWebgpu: Equipo = {
  webgpu: false,
  f16: false,
  placa: null,
  memoriaGb: 4,
  nucleos: 4,
  bufferMaximoMb: null,
};

const medidas = (pasadaEstimadaMs: number): Medidas => ({ gflops: 1000, pasadaEstimadaMs });

describe("estimarPasada", () => {
  it("la placa de referencia da la pasada medida y las demás escalan en proporción", () => {
    expect(estimarPasada(1030)).toBe(2800);
    expect(estimarPasada(2060)).toBe(1400);
    expect(estimarPasada(257.5)).toBe(11_200);
  });

  it("una placa que no dio ningún número no llega nunca", () => {
    expect(estimarPasada(0)).toBe(Number.POSITIVE_INFINITY);
    expect(estimarPasada(Number.NaN)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("recomendar", () => {
  it.each([
    [300, 4],
    [599, 4],
    [600, 3],
    [1199, 3],
    [1200, 2],
    [2499, 2],
    [2500, 1],
    [5000, 1],
  ])("una pasada estimada de %i ms da el nivel %i", (pasadaMs, nivel) => {
    expect(recomendar(conF16, medidas(pasadaMs)).nivel).toBe(nivel);
  });

  it("con f16 usa Whisper sin comprimir y sin f16, comprimido", () => {
    expect(recomendar(conF16, medidas(900)).version).toBe("fp16");
    expect(recomendar(sinF16, medidas(900)).version).toBe("q4");
  });

  it("una placa vieja sin f16 (2,8 s por pasada) queda en el nivel 1 y sin nube", () => {
    const recomendacion = recomendar(sinF16, medidas(estimarPasada(1030)));
    expect(recomendacion.nivel).toBe(1);
    expect(recomendacion.usarNube).toBe(false);
    expect(recomendacion.motivos.map((motivo) => motivo.codigo)).toEqual([
      "sin-f16-comprimido",
      "pasada-lenta",
    ]);
  });

  it("si no llega en vivo ni por frases, recomienda la nube", () => {
    const recomendacion = recomendar(sinF16, medidas(7000));
    expect(recomendacion.usarNube).toBe(true);
    expect(recomendacion.motivos).toContainEqual({ codigo: "no-llega-en-vivo", pasadaMs: 7000 });
  });

  it("sin WebGPU no hay versión local: nube y nivel 1", () => {
    expect(recomendar(sinWebgpu, null)).toMatchObject({
      version: null,
      nivel: 1,
      usarNube: true,
      motivos: [{ codigo: "sin-webgpu" }],
    });
  });

  it("solo una placa con f16, rápida y con lugar para el modelo tiene margen para TranslateGemma", () => {
    expect(recomendar(conF16, medidas(800)).margenParaGemma).toBe(true);
    expect(recomendar(conF16, medidas(2000)).margenParaGemma).toBe(false);
    expect(recomendar(sinF16, medidas(800)).margenParaGemma).toBe(false);
  });

  it("con poca RAM o un buffer chico, TranslateGemma no entra aunque la placa sea rápida", () => {
    const pocaRam = recomendar({ ...conF16, memoriaGb: 4 }, medidas(800));
    expect(pocaRam.margenParaGemma).toBe(false);
    expect(pocaRam.motivos).toContainEqual({ codigo: "poca-memoria", memoriaGb: 4 });
    expect(pocaRam.motivos).toContainEqual({ codigo: "gemma-pide-memoria" });

    const bufferChico = recomendar({ ...conF16, bufferMaximoMb: 1024 }, medidas(800));
    expect(bufferChico.margenParaGemma).toBe(false);
    expect(bufferChico.motivos).toContainEqual({ codigo: "gemma-pide-memoria" });
  });

  it("sin medir, recomienda el nivel 2 y no inventa velocidad", () => {
    const recomendacion = recomendar(conF16, null);
    expect(recomendacion.nivel).toBe(2);
    expect(recomendacion.margenParaGemma).toBe(false);
    expect(recomendacion.motivos.map((motivo) => motivo.codigo)).toEqual(["f16-sin-comprimir"]);
  });
});

describe("pasadaProvisoriaDelNivel", () => {
  it("el nivel 1 son solo frases completas y los demás suben la frecuencia", () => {
    expect([1, 2, 3, 4].map((nivel) => pasadaProvisoriaDelNivel(nivel as 1 | 2 | 3 | 4))).toEqual([
      0, 2000, 1000, 400,
    ]);
  });
});
