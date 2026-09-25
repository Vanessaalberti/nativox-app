import { describe, expect, it } from "vitest";
import { leerGlosario } from "@compartido/glosario";
import { crearCola, traducirConContexto, ultimoTramoSinCerrar, type Traductor } from "./index";

const glosario = leerGlosario("Workers AI\nCloudflare\nrama main => en: main branch");

// Traductor de mentira que respeta las marcas y anota lo que le pidieron. `responder` decide
// qué devuelve para cada texto.
function traductorDePrueba(
  marca: Traductor["marca"],
  responder: (texto: string) => string = (texto) => texto.toUpperCase(),
) {
  const pedidos: string[] = [];
  const traductor: Traductor = {
    nombre: "prueba",
    marca,
    nivel: "rapido",
    traducir: (texto) => {
      pedidos.push(texto);
      return Promise.resolve({ ok: true, valor: responder(texto) });
    },
  };
  return { traductor, pedidos };
}

const conservarMarcas = (texto: string) =>
  texto.replace(
    /(^|>)([^<]*)(<|$)/g,
    (_, a: string, b: string, c: string) => a + b.toUpperCase() + c,
  );

describe("ultimoTramoSinCerrar", () => {
  it.each([
    ["Usamos modelos en la nube, como Workers AI", "como Workers AI"],
    ["Terminamos la demo.", ""],
    ["¿Se entiende?", ""],
    [
      "uno dos tres cuatro cinco seis siete ocho nueve diez",
      "tres cuatro cinco seis siete ocho nueve diez",
    ],
    ["", ""],
  ])("«%s» → «%s»", (anterior, esperado) => {
    expect(ultimoTramoSinCerrar(anterior)).toBe(esperado);
  });
});

describe("traducirConContexto", () => {
  it("sin contexto, traduce el fragmento solo con el glosario protegido", async () => {
    const { traductor, pedidos } = traductorDePrueba("html", conservarMarcas);
    const resultado = await traducirConContexto(traductor, {
      texto: "corre en Workers AI",
      contexto: "",
      glosario,
      de: "es",
      a: "en",
    });

    expect(pedidos).toEqual(['corre en <span data-g="0">Workers AI</span>']);
    expect(resultado).toEqual({
      ok: true,
      valor: { texto: "CORRE EN Workers AI", terminosPerdidos: [], usoContexto: false },
    });
  });

  it("con marca html, manda el contexto y se queda solo con la parte nueva", async () => {
    const { traductor, pedidos } = traductorDePrueba("html", conservarMarcas);
    const resultado = await traducirConContexto(traductor, {
      texto: "de Cloudflare es rápido",
      contexto: "como Workers AI",
      glosario,
      de: "es",
      a: "en",
    });

    expect(pedidos[0]).toBe(
      'como Workers AI <span data-c>de <span data-g="0">Cloudflare</span> es rápido</span>',
    );
    expect(resultado.ok && resultado.valor).toEqual({
      texto: "DE Cloudflare ES RÁPIDO",
      terminosPerdidos: [],
      usoContexto: true,
    });
  });

  it("con marca de código, separa el contexto con un salto de línea y toma la última", async () => {
    const { traductor, pedidos } = traductorDePrueba("codigo", (texto) =>
      texto.replace("como", "like").replace("de", "from"),
    );
    const resultado = await traducirConContexto(traductor, {
      texto: "de `Cloudflare`",
      contexto: "como Workers AI",
      glosario: [],
      de: "es",
      a: "en",
    });

    expect(pedidos[0]).toBe("como Workers AI\nde `Cloudflare`");
    expect(resultado.ok && resultado.valor.texto).toBe("from `Cloudflare`");
  });

  it("si con contexto vuelve demasiado corto, lo descarta y traduce solo", async () => {
    const { traductor, pedidos } = traductorDePrueba("html", (texto) =>
      texto.includes("data-c") ? "x <span data-c>ok</span>" : "hacemos rollback a la anterior",
    );
    const resultado = await traducirConContexto(traductor, {
      texto: "hacemos rollback a la versión anterior",
      contexto: "si falla",
      glosario: [],
      de: "es",
      a: "en",
    });

    expect(pedidos).toHaveLength(2);
    expect(resultado.ok && resultado.valor.usoContexto).toBe(false);
  });

  it("si con contexto se pierde un término, lo descarta", async () => {
    const { traductor } = traductorDePrueba("html", (texto) =>
      texto.includes("data-c")
        ? "a <span data-c>the workers ai platform is fast</span>"
        : conservarMarcas(texto),
    );
    const resultado = await traducirConContexto(traductor, {
      texto: "la plataforma Workers AI es rápida",
      contexto: "y además",
      glosario,
      de: "es",
      a: "en",
    });

    expect(resultado.ok && resultado.valor).toEqual({
      texto: "LA PLATAFORMA Workers AI ES RÁPIDA",
      terminosPerdidos: [],
      usoContexto: false,
    });
  });

  it("usa la traducción fija del glosario", async () => {
    const { traductor } = traductorDePrueba("html", conservarMarcas);
    const resultado = await traducirConContexto(traductor, {
      texto: "clonamos la rama main",
      contexto: "",
      glosario,
      de: "es",
      a: "en",
    });

    expect(resultado.ok && resultado.valor.texto).toBe("CLONAMOS LA main branch");
  });
});

describe("crearCola", () => {
  it("atiende las tareas de a una y en orden", async () => {
    const cola = crearCola();
    const orden: string[] = [];
    const tarea = (nombre: string, ms: number) => () =>
      new Promise<string>((resolver) =>
        setTimeout(() => {
          orden.push(nombre);
          resolver(nombre);
        }, ms),
      );

    await Promise.all([cola(tarea("línea nueva", 20)), cola(tarea("corrección", 1))]);
    expect(orden).toEqual(["línea nueva", "corrección"]);
  });

  it("una tarea que falla no traba las siguientes", async () => {
    const cola = crearCola();
    const falla = cola(() => Promise.reject(new Error("se cortó")));
    const sigue = cola(() => Promise.resolve("sigue"));

    await expect(falla).rejects.toThrow("se cortó");
    await expect(sigue).resolves.toBe("sigue");
  });
});
