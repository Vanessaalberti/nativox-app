import { describe, expect, it } from "vitest";
import guion from "../../muestras/referencias/guion-prueba.txt?raw";
import glosarioDelGuion from "../../muestras/referencias/guion-prueba.glosario.txt?raw";
import {
  armarPromptWhisper,
  corregirTranscripcion,
  leerGlosario,
  proteger,
  restaurar,
  type Marca,
} from "./index";

const entradas = leerGlosario(glosarioDelGuion);
const frases = guion.split(/\r?\n/).filter((frase) => frase !== "");

const corregir = (texto: string) => corregirTranscripcion(texto, entradas).texto;

describe("leerGlosario", () => {
  it("lee términos, variantes y traducciones fijas", () => {
    const leidas = leerGlosario(
      "# comentario\nKubernetes\n\nNerdearla ~ ner de arla, nerd earla\nrama main => en: main branch | pt: branch main",
    );

    expect(leidas).toEqual([
      { termino: "Kubernetes", variantes: [], traducciones: {} },
      { termino: "Nerdearla", variantes: ["ner de arla", "nerd earla"], traducciones: {} },
      {
        termino: "rama main",
        variantes: [],
        traducciones: { en: "main branch", pt: "branch main" },
      },
    ]);
  });

  it("une un término repetido", () => {
    const leidas = leerGlosario("Konex ~ conex\nkonex ~ conecs => en: Konex");

    expect(leidas).toEqual([
      { termino: "Konex", variantes: ["conex", "conecs"], traducciones: { en: "Konex" } },
    ]);
  });

  it("lee el glosario del guion de prueba", () => {
    expect(entradas).toHaveLength(30);
  });
});

describe("corregirTranscripcion", () => {
  const glosario = leerGlosario("Workers AI\nCI/CD\npull request\nKonex\nGitHub\nAPI\nrollback");

  it.each([
    ["usamos Workers Day de AI de Cloudflare", "usamos Workers AI de Cloudflare"],
    ["el pipeline de CI y CD", "el pipeline de CI/CD"],
    ["el pipeline de CI CD", "el pipeline de CI/CD"],
    ["revisen el pul request", "revisen el pull request"],
    ["desde el Conex", "desde el Konex"],
    ["un issue en github", "un issue en GitHub"],
    ["la api devolvió", "la API devolvió"],
  ])("%s → %s", (transcripto, esperado) => {
    expect(corregirTranscripcion(transcripto, glosario).texto).toBe(esperado);
  });

  it("no se come la palabra vecina: «rollback a»", () => {
    expect(corregirTranscripcion("hacemos rollback a la versión", glosario).texto).toBe(
      "hacemos rollback a la versión",
    );
    expect(corregirTranscripcion("hacemos rolback a la versión", glosario).texto).toBe(
      "hacemos rollback a la versión",
    );
  });

  it("corrige las variantes cargadas", () => {
    expect(corregir("Hoy en ner de arla hablamos")).toBe("Hoy en Nerdearla hablamos");
  });

  it("devuelve qué cambió", () => {
    expect(corregirTranscripcion("el pul request en github", glosario).correcciones).toEqual([
      { desde: "pul request", hacia: "pull request" },
      { desde: "github", hacia: "GitHub" },
    ]);
  });

  it("no toca los plurales ni las siglas con números parecidas", () => {
    expect(corregir("abrimos dos issues y un error HTTP 428")).toBe(
      "abrimos dos issues y un error HTTP 428",
    );
  });

  it("no cruza comas ni puntos para armar un término", () => {
    expect(corregirTranscripcion("Workers. AI", glosario).texto).toBe("Workers. AI");
  });

  it("deja igual el guion de prueba bien escrito", () => {
    for (const frase of frases) {
      expect(corregirTranscripcion(frase, entradas).correcciones).toEqual([]);
    }
  });
});

describe("proteger y restaurar", () => {
  // Traductor de mentira: cambia todo lo que no está marcado, como haría uno real.
  const traducirRespetandoMarcas = (texto: string) =>
    texto
      .split(/(<span data-g="\d+">[\s\S]*?<\/span>|`[^`]*`)/)
      .map((parte, indice) => (indice % 2 === 1 ? parte : parte.toUpperCase()))
      .join("");

  const protegerYRestaurar = (frase: string, idioma: string, marca: Marca) => {
    const protegido = proteger(frase, entradas, idioma, marca);
    return { protegido, ...restaurar(traducirRespetandoMarcas(protegido.texto), protegido) };
  };

  it.each<Marca>(["html", "codigo"])(
    "devuelve los 56 términos del guion (es → en y pt) con marca %s",
    (marca) => {
      let protegidos = 0;
      for (const idioma of ["en", "pt"]) {
        for (const frase of frases) {
          const { protegido, terminosPerdidos } = protegerYRestaurar(frase, idioma, marca);
          protegidos += protegido.terminos.length;
          expect(terminosPerdidos).toEqual([]);
        }
      }
      expect(protegidos).toBe(56);
    },
  );

  it("usa la traducción fija del idioma destino", () => {
    const { texto } = protegerYRestaurar("Clonamos la rama main", "en", "html");
    expect(texto).toBe("CLONAMOS LA main branch");
  });

  it("marca con HTML para Bergamot y escapa el resto", () => {
    const protegido = proteger("si a < b, la API responde", entradas, "en", "html");
    expect(protegido.texto).toBe('si a &lt; b, la <span data-g="0">API</span> responde');
    expect(restaurar(protegido.texto, protegido).texto).toBe("si a < b, la API responde");
  });

  it("marca con formato de código para los modelos de lenguaje", () => {
    const protegido = proteger("la API key de Gemini", entradas, "en", "codigo");
    expect(protegido.texto).toBe("la `API key` de `Gemini`");
  });

  it("restaura aunque el traductor cambie el orden de los términos", () => {
    const protegido = proteger("Whisper y Gemini", entradas, "en", "codigo");
    expect(restaurar("`Gemini` and `Whisper`", protegido)).toEqual({
      texto: "Gemini and Whisper",
      terminosPerdidos: [],
    });
  });

  it("avisa qué términos se perdieron", () => {
    const protegido = proteger("hacemos rollback en GitHub", entradas, "en", "html");
    const { terminosPerdidos } = restaurar("we roll back on GitHub", protegido);
    expect(terminosPerdidos).toEqual(["rollback"]);
  });
});

describe("armarPromptWhisper", () => {
  it("pone los términos por prioridad y el final del texto anterior", () => {
    const glosario = leerGlosario("Nerdearla\nKonex");
    expect(armarPromptWhisper(glosario, "Hoy hablamos de observabilidad.")).toBe(
      "Nerdearla, Konex. Hoy hablamos de observabilidad.",
    );
  });

  it("usa solo los últimos ~200 caracteres, empezando en una palabra entera", () => {
    const anterior = "palabra ".repeat(60).trim();
    const prompt = armarPromptWhisper([], anterior);
    expect(prompt.length).toBeLessThanOrEqual(200);
    expect(prompt.startsWith("palabra")).toBe(true);
  });

  it("no se pasa de 224 tokens aunque el glosario sea largo", () => {
    const largo = leerGlosario(
      Array.from({ length: 300 }, (_, i) => `termino${String(i)}`).join("\n"),
    );
    const prompt = armarPromptWhisper(largo, "texto anterior");

    expect(prompt.length).toBeLessThanOrEqual(224 * 3);
    expect(prompt.startsWith("termino0, termino1")).toBe(true);
    expect(prompt.endsWith("texto anterior")).toBe(true);
  });

  it("sin glosario ni texto anterior queda vacío", () => {
    expect(armarPromptWhisper([], "")).toBe("");
  });
});
