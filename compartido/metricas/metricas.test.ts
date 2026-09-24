import { describe, expect, it } from "vitest";
import { calcularWer, contarTerminos, llegaEnVivo } from "./index";

describe("calcularWer", () => {
  it("es cero si solo cambian mayúsculas, tildes o puntuación", () => {
    expect(calcularWer("Revisen el pull request, ¿sí?", "revisen el Pull Request si")).toBe(0);
  });

  it("cuenta la palabra que se perdió en el corte", () => {
    const referencia = "ask not what your country can do for you";
    expect(calcularWer(referencia, "ask what your country can do for you")).toBeCloseTo(1 / 9);
  });

  it("cuenta reemplazos e inserciones", () => {
    expect(calcularWer("abrimos un issue", "abrimos un issue en github")).toBeCloseTo(2 / 3);
    expect(calcularWer("error 429", "error 428")).toBe(0.5);
  });

  it("puede pasar de 1 con una alucinación larga", () => {
    expect(calcularWer("hola", "gracias por ver el video")).toBe(5);
  });

  it("con la referencia vacía es 0 si no hay nada y 1 si hay algo", () => {
    expect(calcularWer("", "")).toBe(0);
    expect(calcularWer("", "gracias por ver el video")).toBe(1);
  });
});

describe("contarTerminos", () => {
  const terminos = ["GitHub", "pull request", "CI/CD"];

  it("cuenta cada aparición de la referencia", () => {
    expect(
      contarTerminos(
        "El pull request de GitHub pasa por CI/CD y vuelve a GitHub",
        "El pul request de github pasa por CI CD y vuelve a Git Hub",
        terminos,
      ),
    ).toEqual({ bien: 2, total: 4 });
  });

  it("no suma de más si la hipótesis repite un término", () => {
    expect(contarTerminos("en GitHub", "en GitHub GitHub GitHub", terminos)).toEqual({
      bien: 1,
      total: 1,
    });
  });
});

describe("llegaEnVivo", () => {
  it("llega si en el percentil 80 procesar tarda menos que el fragmento", () => {
    expect(llegaEnVivo([2, 2.5, 3, 2.2, 9], [5, 5, 5, 5, 5])).toBe(true);
  });

  it("no llega si la mayoría tarda más que su largo real", () => {
    expect(llegaEnVivo([4, 4, 4, 4, 4], [5, 3, 3, 3, 5])).toBe(false);
  });

  it("sin mediciones no se puede decir que llega", () => {
    expect(llegaEnVivo([], [])).toBe(false);
  });

  it("falla si falta el largo de algún fragmento", () => {
    expect(() => llegaEnVivo([1, 2], [5])).toThrow("un largo por duración");
  });
});
