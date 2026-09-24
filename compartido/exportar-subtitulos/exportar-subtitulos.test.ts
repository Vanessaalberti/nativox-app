import { describe, expect, it } from "vitest";
import { aSrt, aTexto, aVtt, type Segmento } from "./index";

const segmentos: Segmento[] = [
  { inicio: 0.5, fin: 2.25, texto: "And so, my fellow Americans," },
  { inicio: 2.3, fin: 5.0004, texto: "ask not what your country can do for you." },
];

describe("aSrt", () => {
  it("numera desde 1 y usa coma para los milisegundos", () => {
    expect(aSrt(segmentos)).toBe(
      "1\n00:00:00,500 --> 00:00:02,250\nAnd so, my fellow Americans,\n\n" +
        "2\n00:00:02,300 --> 00:00:05,000\nask not what your country can do for you.\n",
    );
  });

  it("redondea al milisegundo y llega a las horas", () => {
    const largo = [{ inicio: 3723.4567, fin: 3724.0005, texto: "Hola" }];
    expect(aSrt(largo)).toBe("1\n01:02:03,457 --> 01:02:04,001\nHola\n");
  });

  it("parte los renglones largos en ~42 caracteres", () => {
    const texto =
      "Si el deploy falla en producción, hacemos rollback a la versión anterior y abrimos un issue.";
    const [, , ...renglones] = aSrt([{ inicio: 0, fin: 4, texto }])
      .trim()
      .split("\n");

    expect(renglones.length).toBeGreaterThan(1);
    for (const renglon of renglones) expect(renglon.length).toBeLessThanOrEqual(42);
    expect(renglones.join(" ")).toBe(texto);
  });
});

describe("corrimiento", () => {
  it("adelanta las marcas con un corrimiento negativo", () => {
    expect(aSrt(segmentos, { corrimientoSegundos: -2 })).toBe(
      "1\n00:00:00,000 --> 00:00:00,250\nAnd so, my fellow Americans,\n\n" +
        "2\n00:00:00,300 --> 00:00:03,000\nask not what your country can do for you.\n",
    );
  });

  it("descarta lo que termina antes de 0 y renumera", () => {
    const srt = aSrt(segmentos, { corrimientoSegundos: -2.25 });
    expect(srt.startsWith("1\n00:00:00,050 --> 00:00:02,750\nask not")).toBe(true);
    expect(srt).not.toContain("Americans");
  });

  it("atrasa con un corrimiento positivo", () => {
    expect(aVtt(segmentos.slice(0, 1), { corrimientoSegundos: 10 })).toContain(
      "00:00:10.500 --> 00:00:12.250",
    );
  });
});

describe("aVtt", () => {
  it("empieza con WEBVTT y usa punto para los milisegundos", () => {
    expect(aVtt(segmentos)).toBe(
      "WEBVTT\n\n00:00:00.500 --> 00:00:02.250\nAnd so, my fellow Americans,\n\n" +
        "00:00:02.300 --> 00:00:05.000\nask not what your country can do for you.\n",
    );
  });

  it("escapa lo que VTT tomaría como marca", () => {
    expect(aVtt([{ inicio: 0, fin: 1, texto: "si a < b --> R&D" }])).toContain(
      "si a &lt; b → R&amp;D",
    );
  });
});

describe("aTexto", () => {
  it("pone un segmento por renglón, en orden y sin los vacíos", () => {
    const desordenados = [segmentos[1], { inicio: 1, fin: 2, texto: "  " }, segmentos[0]].filter(
      (segmento) => segmento !== undefined,
    );
    expect(aTexto(desordenados)).toBe(
      "And so, my fellow Americans,\nask not what your country can do for you.\n",
    );
  });

  it("sin segmentos queda vacío", () => {
    expect(aTexto([])).toBe("");
  });
});
