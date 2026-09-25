import { describe, expect, it } from "vitest";
import type { Linea } from "@compartido/contratos";
import { mezclarLinea } from "./index";

const linea = (id: string, original: string, provisoria = false): Linea => ({
  tipo: "linea",
  id,
  original,
  traducciones: {},
  provisoria,
  inicio: 0,
  fin: 1,
});

describe("mezclarLinea", () => {
  it("una línea nueva va al final", () => {
    const lineas = mezclarLinea([linea("a", "uno")], linea("b", "dos"));

    expect(lineas.map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("una línea con el mismo id la reemplaza en su lugar y no se duplica", () => {
    const lineas = mezclarLinea(
      [linea("a", "hola mun", true), linea("b", "dos")],
      linea("a", "hola mundo"),
    );

    expect(lineas).toHaveLength(2);
    expect(lineas[0]).toMatchObject({ id: "a", original: "hola mundo", provisoria: false });
  });

  it("solo recuerda las últimas", () => {
    const lineas = ["a", "b", "c", "d"].reduce<Linea[]>(
      (acumuladas, id) => mezclarLinea(acumuladas, linea(id, id), 3),
      [],
    );

    expect(lineas.map((l) => l.id)).toEqual(["b", "c", "d"]);
  });
});
