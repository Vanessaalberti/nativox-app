import { describe, expect, it } from "vitest";
import { distanciaEdicion } from "./index";

const letras = (texto: string) => Array.from(texto);

describe("distanciaEdicion", () => {
  it("es cero entre secuencias iguales", () => {
    expect(distanciaEdicion(letras("konex"), letras("konex"))).toBe(0);
  });

  it("cuenta reemplazos, inserciones y borrados", () => {
    expect(distanciaEdicion(letras("conex"), letras("konex"))).toBe(1);
    expect(distanciaEdicion(letras("pul request"), letras("pull request"))).toBe(1);
    expect(distanciaEdicion(letras("gato"), letras("gatos"))).toBe(1);
    expect(distanciaEdicion(letras("kitten"), letras("sitting"))).toBe(3);
  });

  it("con una secuencia vacía es el largo de la otra", () => {
    expect(distanciaEdicion([], letras("abc"))).toBe(3);
    expect(distanciaEdicion(letras("abc"), [])).toBe(3);
  });

  it("funciona con palabras", () => {
    expect(distanciaEdicion(["ask", "not", "what"], ["ask", "what"])).toBe(1);
  });
});
