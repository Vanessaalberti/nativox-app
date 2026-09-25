import { describe, expect, it } from "vitest";
import { crearEmisorEnTiempoReal } from "./tiempo-real";

function relojDePrueba() {
  let ahora = 1000;
  return { ahoraMs: () => ahora, pasar: (ms: number) => (ahora += ms) };
}

describe("crearEmisorEnTiempoReal", () => {
  const audio = Float32Array.from({ length: 16_000 + 800 }, (_, i) => i);

  function prepararEmisor() {
    const reloj = relojDePrueba();
    const bloques: Float32Array[] = [];
    const emisor = crearEmisorEnTiempoReal({
      audio,
      frecuencia: 16_000,
      muestrasPorBloque: 1600,
      reloj,
      alRecibir: (bloque) => bloques.push(bloque),
    });
    return { reloj, bloques, emisor };
  }

  it("no manda nada antes de que pase el tiempo", () => {
    const { bloques, emisor } = prepararEmisor();
    emisor.avanzar();
    expect(bloques).toHaveLength(0);
  });

  it("manda un bloque cada 100 ms y en orden", () => {
    const { reloj, bloques, emisor } = prepararEmisor();
    reloj.pasar(100);
    emisor.avanzar();
    reloj.pasar(100);
    emisor.avanzar();

    expect(bloques).toHaveLength(2);
    expect(bloques[1]?.[0]).toBe(1600);
  });

  it("si el temporizador llega tarde, se pone al día", () => {
    const { reloj, bloques, emisor } = prepararEmisor();
    reloj.pasar(450);
    emisor.avanzar();

    expect(bloques).toHaveLength(4);
  });

  it("al final manda lo que sobra y avisa que terminó", () => {
    const { reloj, bloques, emisor } = prepararEmisor();
    reloj.pasar(5000);

    expect(emisor.avanzar()).toBe(false);
    expect(bloques).toHaveLength(11);
    expect(bloques.at(-1)?.length).toBe(800);
  });
});
