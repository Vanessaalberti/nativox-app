import { describe, expect, it } from "vitest";
import {
  borrarSuperposicion,
  crearAcuerdoLocal,
  crearWhisperLocal,
  limpiarAlucinaciones,
  transcribirSinAlucinaciones,
} from "./index";

describe("limpiarAlucinaciones", () => {
  it.each([
    "Gracias por ver el video.",
    "¡Suscríbete al canal!",
    "Suscribite.",
    "Subtítulos realizados por la comunidad de Amara.org",
    "Thanks for watching!",
    "Obrigado por assistir.",
  ])("borra «%s»", (cierre) => {
    expect(limpiarAlucinaciones(`Abrimos un issue en GitHub. ${cierre}`)).toEqual({
      texto: "Abrimos un issue en GitHub.",
      alucino: true,
    });
  });

  it("si Whisper devuelve el prompt en lugar de transcribir, no se dijo nada", () => {
    const prompt = "Nerdearla, Cloudflare, Workers AI, rollback, pull request y GitHub.";
    expect(limpiarAlucinaciones("Workers AI, rollback, pull request", prompt)).toEqual({
      texto: "",
      alucino: true,
    });
    // Una palabra suelta del glosario sí puede ser lo que se dijo.
    expect(limpiarAlucinaciones("rollback", prompt)).toEqual({ texto: "rollback", alucino: false });
  });

  it("deja lo que se dice de verdad en una charla", () => {
    const texto =
      "Gracias a todos por venir. Nos vemos en el próximo Nerdearla. You subscribe to the topic.";
    expect(limpiarAlucinaciones(texto)).toEqual({ texto, alucino: false });
  });
});

describe("transcribirSinAlucinaciones", () => {
  // Motor de mentira: devuelve las respuestas en orden y anota con qué prompt lo llamaron.
  function motor(...respuestas: string[]) {
    const prompts: string[] = [];
    const transcriptor = crearWhisperLocal({
      transcribir: (_audio, { prompt }) => {
        prompts.push(prompt);
        return Promise.resolve({ ok: true, valor: { texto: respuestas.shift() ?? "", ms: 100 } });
      },
    });
    return { transcriptor, prompts };
  }
  const audio = new Float32Array(16_000);

  it("si alucinó, reintenta una sola vez sin el prompt", async () => {
    const { transcriptor, prompts } = motor("Gracias por ver el video.", "hacemos rollback");
    const resultado = await transcribirSinAlucinaciones(transcriptor, audio, {
      prompt: "rollback, GitHub.",
      idioma: "es",
    });

    expect(prompts).toEqual(["rollback, GitHub.", ""]);
    expect(resultado).toEqual({
      ok: true,
      valor: { texto: "hacemos rollback", ms: 200, reintento: true },
    });
  });

  it("no reintenta más de una vez aunque vuelva a alucinar", async () => {
    const { transcriptor, prompts } = motor("Suscribite.", "Gracias por ver.", "no se usa");
    const resultado = await transcribirSinAlucinaciones(transcriptor, audio, {
      prompt: "x",
      idioma: "es",
    });

    expect(prompts).toHaveLength(2);
    expect(resultado.ok && resultado.valor.texto).toBe("");
  });

  it("sin alucinación, una sola pasada", async () => {
    const { transcriptor, prompts } = motor("hola a todos");
    await transcribirSinAlucinaciones(transcriptor, audio, { prompt: "x", idioma: "es" });
    expect(prompts).toHaveLength(1);
  });
});

describe("borrarSuperposicion", () => {
  it("borra lo repetido por el contexto de audio", () => {
    expect(
      borrarSuperposicion(
        "ask not what your country can do for you,",
        "can do for you, ask what you can do for your country.",
      ),
    ).toBe("ask what you can do for your country.");
  });

  it("aunque el contexto empiece a mitad de una palabra", () => {
    expect(
      borrarSuperposicion(
        "hacemos rollback a la versión anterior",
        "a versión anterior y abrimos un issue",
      ),
    ).toBe("y abrimos un issue");
  });

  it("no borra una palabra corta que se repite de verdad", () => {
    expect(borrarSuperposicion("vamos a ver", "a ver qué pasa")).toBe("qué pasa");
    expect(borrarSuperposicion("esto y", "y aquello")).toBe("y aquello");
  });

  it("sin repetición, deja todo", () => {
    expect(borrarSuperposicion("hola", "abrimos un issue")).toBe("abrimos un issue");
  });
});

describe("crearAcuerdoLocal", () => {
  it("lo que coincide en dos pasadas queda estable y no retrocede", () => {
    const acuerdo = crearAcuerdoLocal();

    expect(acuerdo.agregarPasada("Answer.")).toEqual({ estable: "", provisorio: "Answer." });
    expect(acuerdo.agregarPasada("And so, my fellow")).toEqual({
      estable: "",
      provisorio: "And so, my fellow",
    });
    expect(acuerdo.agregarPasada("And so, my fellow Americans,")).toEqual({
      estable: "And so, my fellow",
      provisorio: "Americans,",
    });
    expect(acuerdo.agregarPasada("And so my")).toEqual({
      estable: "And so, my fellow",
      provisorio: "",
    });
  });

  it("vuelve a empezar después del corte", () => {
    const acuerdo = crearAcuerdoLocal();
    acuerdo.agregarPasada("uno dos");
    acuerdo.agregarPasada("uno dos tres");
    acuerdo.reiniciar();

    expect(acuerdo.agregarPasada("cuatro")).toEqual({ estable: "", provisorio: "cuatro" });
  });
});
