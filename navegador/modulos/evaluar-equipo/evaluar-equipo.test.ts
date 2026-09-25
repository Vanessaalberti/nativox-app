import { describe, expect, it } from "vitest";
import { medirEquipo, pasadaProvisoriaDelNivel, recomendar, type Equipo } from "./index";

const conF16: Equipo = {
  webgpu: true,
  f16: true,
  placa: "Intel Iris Xe",
  memoriaGb: 8,
  nucleos: 8,
};
const sinF16: Equipo = { ...conF16, f16: false, placa: "AMD Radeon RX 480" };
const sinWebgpu: Equipo = { webgpu: false, f16: false, placa: null, memoriaGb: 4, nucleos: 4 };

const medidas = (pasadaMs: number) => ({ pasadaMs, traduccionMs: 60 });

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
  ])("una pasada de %i ms da el nivel %i", (pasadaMs, nivel) => {
    expect(recomendar(conF16, medidas(pasadaMs)).nivel).toBe(nivel);
  });

  it("con f16 usa Whisper sin comprimir y sin f16, comprimido", () => {
    expect(recomendar(conF16, medidas(900)).version).toBe("fp16");
    expect(recomendar(sinF16, medidas(900)).version).toBe("q4");
  });

  it("una placa vieja sin f16 (2,5 s por pasada) queda en el nivel 1 y sin nube", () => {
    const recomendacion = recomendar(sinF16, medidas(2500));
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
    expect(recomendacion.motivos.at(-1)).toEqual({ codigo: "no-llega-en-vivo", pasadaMs: 7000 });
  });

  it("sin WebGPU no hay versión local: nube y nivel 1", () => {
    expect(recomendar(sinWebgpu, null)).toMatchObject({
      version: null,
      nivel: 1,
      usarNube: true,
      motivos: [{ codigo: "sin-webgpu" }],
    });
  });

  it("solo una placa con f16 y buena velocidad tiene margen para TranslateGemma", () => {
    expect(recomendar(conF16, medidas(800)).margenParaGemma).toBe(true);
    expect(recomendar(conF16, medidas(2000)).margenParaGemma).toBe(false);
    expect(recomendar(sinF16, medidas(800)).margenParaGemma).toBe(false);
  });

  it("sin medir, recomienda el nivel 2 y no inventa velocidad", () => {
    const recomendacion = recomendar(conF16, null);
    expect(recomendacion.nivel).toBe(2);
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

describe("medirEquipo", () => {
  it("descarta la primera pasada (calienta la placa) y toma la mediana del resto", async () => {
    const tiempos = [9000, 900, 700, 800];
    const pasos: string[] = [];
    const resultado = await medirEquipo(
      {
        transcribirMuestra: () =>
          Promise.resolve({ ok: true, valor: { ms: tiempos.shift() ?? 0 } }),
        traducirMuestra: () => Promise.resolve({ ok: true, valor: { ms: 50 } }),
      },
      ["en", "pt"],
      (paso) => pasos.push(`${paso.etapa} ${String(paso.hecho)}/${String(paso.total)}`),
    );

    expect(resultado).toEqual({ ok: true, valor: { pasadaMs: 800, traduccionMs: 50 } });
    expect(pasos).toEqual([
      "transcribiendo 0/4",
      "transcribiendo 1/4",
      "transcribiendo 2/4",
      "transcribiendo 3/4",
      "traduciendo 0/2",
      "traduciendo 1/2",
    ]);
  });

  it("si Whisper falla, devuelve el motivo y no sigue", async () => {
    let llamadas = 0;
    const resultado = await medirEquipo(
      {
        transcribirMuestra: () => {
          llamadas++;
          return Promise.resolve({ ok: false, motivo: "sin memoria de video" });
        },
        traducirMuestra: () => Promise.resolve({ ok: true, valor: { ms: 1 } }),
      },
      ["en"],
    );
    expect(resultado).toEqual({ ok: false, motivo: "sin memoria de video" });
    expect(llamadas).toBe(1);
  });
});
