import { describe, expect, it } from "vitest";
import { acotar, estimarNube } from "./estimador";

describe("estimarNube", () => {
  it("una hora de sala cuesta unos 0,037 USD y lo gratis rinde unas 3 horas por día", () => {
    const estimacion = estimarNube({ salasSimultaneas: 1, horasPorDia: 1, dias: 1 });

    expect(estimacion.usdPorHoraDeSala).toBeCloseTo(0.0369, 3);
    expect(estimacion.horasGratisPorDia).toBeCloseTo(2.98, 2);
  });

  it("si todo entra en lo gratis del día, no cuesta nada", () => {
    expect(estimarNube({ salasSimultaneas: 1, horasPorDia: 2, dias: 5 }).usdTotal).toBe(0);
  });

  it("2 salas, 8 horas, 1 día: se paga lo que pasa de las horas gratis", () => {
    const { usdTotal, usdPorHoraDeSala, horasGratisPorDia } = estimarNube({
      salasSimultaneas: 2,
      horasPorDia: 8,
      dias: 1,
    });

    expect(usdTotal).toBeCloseTo((16 - horasGratisPorDia) * usdPorHoraDeSala, 3);
  });

  it("lo gratis se renueva cada día: más días, se paga por cada uno", () => {
    const uno = estimarNube({ salasSimultaneas: 4, horasPorDia: 8, dias: 1 }).usdTotal;
    const tres = estimarNube({ salasSimultaneas: 4, horasPorDia: 8, dias: 3 }).usdTotal;

    expect(tres).toBeCloseTo(uno * 3, 5);
  });
});

describe("acotar", () => {
  const limites = { minimo: 1, maximo: 14 };

  it("deja pasar los valores dentro del rango y redondea", () => {
    expect(acotar("5", limites, 1)).toBe(5);
    expect(acotar("5.6", limites, 1)).toBe(6);
  });

  it("recorta a los límites", () => {
    expect(acotar("0", limites, 3)).toBe(1);
    expect(acotar("99", limites, 3)).toBe(14);
  });

  it("si no es un número, conserva el valor anterior", () => {
    expect(acotar("", limites, 3)).toBe(3);
    expect(acotar("abc", limites, 3)).toBe(3);
  });
});
