import { describe, expect, it } from "vitest";
import {
  diaCorto,
  formatearMinutos,
  hoy,
  lunesDe,
  nombreDelDia,
  semanaDesde,
  sumarDias,
} from "./fechas";
import { agregarTerminos, leerArchivoDeGlosario, sugerirTerminos } from "./glosario";
import { exportar, idiomasDisponibles, segmentosEn } from "./transcripcion";

describe("fechas", () => {
  it("el lunes de una semana, sea cual sea el día", () => {
    expect(lunesDe("2026-10-05")).toBe("2026-10-05");
    expect(lunesDe("2026-10-07")).toBe("2026-10-05");
    expect(lunesDe("2026-10-11")).toBe("2026-10-05");
    expect(lunesDe("2026-10-12")).toBe("2026-10-12");
  });

  it("suma días cruzando meses y años", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("la semana tiene siete días desde el lunes", () => {
    const semana = semanaDesde("2026-10-05");

    expect(semana).toHaveLength(7);
    expect(semana[0]).toBe("2026-10-05");
    expect(semana[6]).toBe("2026-10-11");
    expect(nombreDelDia(semana[6] ?? "")).toBe("Domingo");
  });

  it("hoy es la fecha local, no la de UTC", () => {
    expect(hoy(new Date(2026, 9, 5, 23, 30))).toBe("2026-10-05");
  });

  it("formatea días y horas", () => {
    expect(diaCorto("2026-10-05")).toBe("05/10");
    expect(formatearMinutos(570)).toBe("09:30");
    expect(formatearMinutos(1440)).toBe("24:00");
  });
});

describe("glosario de una charla", () => {
  it("sugiere siglas y nombres, no las palabras comunes ni la mayúscula del comienzo", () => {
    const sugeridos = sugerirTerminos(
      "Kubernetes en producción",
      "Cómo operamos clusters en AWS con Terraform. Hablamos de WebGPU y k8s.",
      "",
    );

    expect(sugeridos).toEqual(["AWS", "Terraform", "WebGPU", "k8s"]);
  });

  it("no repite lo que ya está en el glosario", () => {
    expect(sugerirTerminos("Charla de AWS y GCP", "", "aws")).toEqual(["GCP"]);
  });

  it("suma términos sin repetir y sin renglones vacíos", () => {
    expect(agregarTerminos("Kubernetes", ["AWS", "kubernetes", " ", "GCP"])).toBe(
      "Kubernetes\nAWS\nGCP",
    );
    expect(agregarTerminos("", ["AWS"])).toBe("AWS");
    expect(agregarTerminos("AWS", ["aws"])).toBe("AWS");
  });

  it("de un .csv toma la primera columna; de un .txt, cada renglón como está", () => {
    expect(leerArchivoDeGlosario("terminos.csv", '"CI/CD",integración\nAWS;nube')).toBe(
      "CI/CD\nAWS",
    );
    expect(leerArchivoDeGlosario("terminos.txt", "Nerdearla ~ ner de arla\nAWS")).toBe(
      "Nerdearla ~ ner de arla\nAWS",
    );
  });
});

describe("transcripción de una charla", () => {
  const segmentos = [
    {
      id: "a",
      original: "Hola a todos",
      traducciones: { en: "Hello everyone" },
      inicio: 0,
      fin: 2,
    },
    { id: "b", original: "Gracias", traducciones: {}, inicio: 2, fin: 3 },
  ];

  it("ofrece los idiomas que llegaron traducidos", () => {
    expect(idiomasDisponibles(segmentos)).toEqual(["en"]);
  });

  it("arma el texto en el idioma elegido y deja afuera lo que no tiene esa traducción", () => {
    expect(segmentosEn(segmentos, "original").map((s) => s.texto)).toEqual([
      "Hola a todos",
      "Gracias",
    ]);
    expect(segmentosEn(segmentos, "en").map((s) => s.texto)).toEqual(["Hello everyone"]);
  });

  it("exporta a texto, SRT y VTT con corrimiento, sin marcas antes de 0", () => {
    const original = segmentosEn(segmentos, "original");

    expect(exportar(original, "txt", 0)).toBe("Hola a todos\nGracias\n");
    expect(exportar(original, "srt", 1)).toContain("00:00:01,000 --> 00:00:03,000");
    expect(exportar(original, "vtt", 0)).toMatch(/^WEBVTT/);
    expect(exportar(original, "srt", -2.5)).not.toMatch(/-\d/);
  });
});
