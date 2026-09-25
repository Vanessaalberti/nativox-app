import { describe, expect, it } from "vitest";
import type { Linea } from "@compartido/contratos";
import { leerGlosario } from "@compartido/glosario";
import {
  corregirLimite,
  crearFlujoSubtitulos,
  type FragmentoDeAudio,
  type OpcionesFlujo,
} from "./index";

const glosario = leerGlosario("Workers AI\nCloudflare");

// El "audio" de mentira lleva en la primera muestra el número de fragmento: así el transcriptor
// de mentira sabe qué texto devolver.
function fragmento(numero: number, inicio: number, fin: number): FragmentoDeAudio {
  return {
    numero,
    audio: Float32Array.of(numero),
    inicio,
    fin,
    segundosDeContexto: numero > 0 ? 1.5 : 0,
  };
}

function armar(textos: string[], cambios: Partial<OpcionesFlujo> = {}) {
  const porBloque: FragmentoDeAudio[][] = [];
  const lineas: Linea[] = [];
  const traducciones: string[] = [];
  const fallas: string[] = [];
  let ahora = 0;
  const flujo = crearFlujoSubtitulos({
    idSesion: "s",
    idiomaOriginal: "es",
    idiomasDestino: ["en"],
    glosario,
    pasadaProvisoriaCadaMs: 0,
    cortador: {
      agregar: () => porBloque.shift() ?? [],
      terminar: () => [],
      cambiarMinimo: () => undefined,
      pendiente: () => ({ audio: new Float32Array(0), inicio: 0, tieneVoz: false }),
    },
    transcribir: (audio) =>
      Promise.resolve({ ok: true, valor: { texto: textos[audio[0] ?? 0] ?? "", ms: 50 } }),
    quitarRepetido: (_anterior, nuevo) => nuevo,
    crearAcuerdo: () => ({
      agregarPasada: (texto) => ({ estable: "", provisorio: texto }),
      reiniciar: () => undefined,
    }),
    traducir: ({ texto, a }) => {
      traducciones.push(texto);
      return Promise.resolve({ ok: true, valor: { texto: `${a}:${texto}` } });
    },
    ahoraMs: () => (ahora += 10),
    alCambiarLinea: (linea) => lineas.push(linea),
    alMedir: () => undefined,
    alFallar: (motivo) => fallas.push(motivo),
    ...cambios,
  });
  const decir = async (...fragmentos: FragmentoDeAudio[]) => {
    porBloque.push(fragmentos);
    flujo.agregarAudio(new Float32Array(1600));
    await flujo.terminar();
  };
  const ultimaVersion = () => {
    const porId = new Map(lineas.map((linea) => [linea.id, linea]));
    return [...porId.values()];
  };
  return { decir, lineas, traducciones, fallas, ultimaVersion, flujo };
}

describe("crearFlujoSubtitulos", () => {
  it("traduce a todos los idiomas de la sala y los guarda juntos en la misma línea", async () => {
    const { decir, ultimaVersion } = armar(["Hola a todos."], { idiomasDestino: ["en", "pt"] });
    await decir(fragmento(0, 0, 1));

    expect(ultimaVersion()[0]?.traducciones).toEqual({
      en: "en:Hola a todos.",
      pt: "pt:Hola a todos.",
    });
  });

  it("confirma y traduce cada fragmento en orden", async () => {
    const { decir, ultimaVersion } = armar(["Hola a todos.", "Empezamos."]);
    await decir(fragmento(0, 0, 1), fragmento(1, 1, 2));

    expect(ultimaVersion()).toEqual([
      expect.objectContaining({
        id: "s-0",
        original: "Hola a todos.",
        traducciones: { en: "en:Hola a todos." },
        provisoria: false,
      }),
      expect.objectContaining({
        id: "s-1",
        original: "Empezamos.",
        traducciones: { en: "en:Empezamos." },
      }),
    ]);
  });

  it("«Workers Day» | «de AI» se une en la línea anterior y se vuelve a traducir", async () => {
    const { decir, ultimaVersion, traducciones } = armar([
      "usamos modelos como Workers Day",
      "de AI de Cloudflare",
    ]);
    await decir(fragmento(0, 0, 3), fragmento(1, 3, 5));

    expect(ultimaVersion().map((linea) => [linea.id, linea.original, linea.traducciones])).toEqual([
      ["s-0", "usamos modelos como Workers AI", { en: "en:usamos modelos como Workers AI" }],
      ["s-1", "de Cloudflare", { en: "en:de Cloudflare" }],
    ]);
    // Primero la línea nueva, después la corrección de la anterior.
    expect(traducciones.slice(-2)).toEqual(["de Cloudflare", "usamos modelos como Workers AI"]);
  });

  it("una corrección a mano cambia la línea, rehace la traducción y no pisa lo escrito a mano", async () => {
    const { decir, flujo, ultimaVersion, traducciones } = armar(["Usamos una nube."], {
      idiomasDestino: ["en", "pt"],
    });
    await decir(fragmento(0, 0, 2));

    const aceptada = flujo.corregirLinea("s-0", {
      original: "Usamos una nube pública.",
      traducciones: { en: "We use a cloud, my way", pt: "pt:Usamos una nube." },
    });
    await flujo.terminar();

    expect(aceptada).toBe(true);
    // El inglés se escribió a mano y se conserva; el portugués se rehizo con el texto corregido.
    expect(ultimaVersion()[0]).toMatchObject({
      original: "Usamos una nube pública.",
      traducciones: { en: "We use a cloud, my way", pt: "pt:Usamos una nube pública." },
    });
    expect(traducciones.at(-1)).toBe("Usamos una nube pública.");
  });

  it("no corrige una línea que no existe ni una provisoria", () => {
    const { flujo } = armar([]);

    expect(flujo.corregirLinea("nada", { original: "x", traducciones: {} })).toBe(false);
  });

  it("nunca publica dos líneas para el mismo segmento", async () => {
    const { decir, ultimaVersion } = armar(["uno", "dos", "tres"]);
    await decir(fragmento(0, 0, 1), fragmento(1, 1, 2), fragmento(2, 2, 3));

    expect(ultimaVersion().map((linea) => linea.id)).toEqual(["s-0", "s-1", "s-2"]);
  });

  it("corrige con el glosario antes de mostrar y de traducir", async () => {
    const { decir, traducciones } = armar(["corre en cloud flare"]);
    await decir(fragmento(0, 0, 2));

    expect(traducciones).toEqual(["corre en cloud flare"]);
  });

  it("si Whisper no devolvió nada, la línea queda vacía y no se traduce", async () => {
    const { decir, ultimaVersion, traducciones } = armar([""]);
    await decir(fragmento(0, 0, 1));

    expect(ultimaVersion()).toEqual([expect.objectContaining({ id: "s-0", original: "" })]);
    expect(traducciones).toEqual([]);
  });

  it("si falla una transcripción, avisa y sigue con la siguiente", async () => {
    const { decir, fallas, ultimaVersion } = armar(["", "sigue"], {
      transcribir: (audio) =>
        Promise.resolve(
          audio[0] === 0
            ? { ok: false, motivo: "se perdió la placa de video" }
            : { ok: true, valor: { texto: "sigue", ms: 50 } },
        ),
    });
    await decir(fragmento(0, 0, 1), fragmento(1, 1, 2));

    expect(fallas).toEqual(["se perdió la placa de video"]);
    expect(ultimaVersion().map((linea) => linea.original)).toEqual(["sigue"]);
  });

  it("mide la pasada, la traducción y el retraso de cada línea", async () => {
    const mediciones: unknown[] = [];
    const { decir } = armar(["hola"], { alMedir: (medicion) => mediciones.push(medicion) });
    await decir(fragmento(0, 0, 0));

    expect(mediciones).toEqual([
      expect.objectContaining({
        numero: 0,
        transcripcionMs: 50,
        retrasoConfirmacionSegundos: expect.any(Number),
      }),
    ]);
  });
});

describe("corregirLimite", () => {
  it("no toca nada si el término no está partido", () => {
    expect(corregirLimite("usamos Cloudflare", "para todo", glosario)).toEqual({
      anterior: "usamos Cloudflare",
      nuevo: "para todo",
      cambio: false,
    });
  });
});
