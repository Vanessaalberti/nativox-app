import type { Resultado } from "@compartido/contratos";
import type { Traductor } from "../tipos";

// API de @browsermt/bergamot-translator 0.4 (ver su README). La biblioteca crea su propio worker
// con una ruta relativa a su archivo, por eso se publica tal cual (ver vite.config.ts) y se
// carga por URL en lugar de empaquetarla.
interface TraductorBergamot {
  translate(pedido: { from: string; to: string; text: string; html: boolean }): Promise<{
    target: { text: string };
  }>;
}

interface Respaldo {
  registryUrl: string;
  fetch(url: string, checksum: string | null, extra?: unknown): Promise<ArrayBuffer>;
  loadModelRegistery(): Promise<unknown>;
}

interface ModuloBergamot {
  LatencyOptimisedTranslator: new (opciones: object, respaldo: Respaldo) => TraductorBergamot;
  TranslatorBacking: new (opciones: object) => Respaldo;
}

const CACHE_DE_MODELOS = "nativox-bergamot";

export async function crearBergamot(urlBiblioteca: string): Promise<Resultado<Traductor>> {
  const modulo: unknown = await import(/* @vite-ignore */ urlBiblioteca);
  if (!esModuloBergamot(modulo)) {
    return { ok: false, motivo: `No se pudo cargar Bergamot desde ${urlBiblioteca}.` };
  }

  // Los modelos (~22 MB por dirección) se guardan en la caché del navegador la primera vez: después
  // Bergamot funciona sin internet.
  class RespaldoConCache extends modulo.TranslatorBacking {
    override async fetch(url: string, checksum: string | null, extra?: unknown) {
      const cache = await caches.open(CACHE_DE_MODELOS);
      const guardado = await cache.match(url);
      if (guardado) return guardado.arrayBuffer();
      const datos = await super.fetch(url, checksum, extra);
      await cache.put(url, new Response(datos.slice(0)));
      return datos;
    }

    // Igual que el original, pero la lista de modelos también sale de la caché si no hay red.
    override async loadModelRegistery() {
      const registro: unknown = await leerConRespaldo(this.registryUrl);
      if (typeof registro !== "object" || registro === null) {
        throw new Error("La lista de modelos de Bergamot llegó vacía o rota");
      }
      return Object.entries(registro).map(([par, files]) => ({
        from: par.slice(0, 2),
        to: par.slice(2, 4),
        files: files as unknown,
      }));
    }
  }

  const opciones = { pivotLanguage: "en" };
  const traductor = new modulo.LatencyOptimisedTranslator(opciones, new RespaldoConCache(opciones));

  return {
    ok: true,
    valor: {
      nombre: "Bergamot (Mozilla)",
      marca: "clave",
      nivel: "rapido",
      async traducir(texto, de, a) {
        try {
          const { target } = await traductor.translate({
            from: de,
            to: a,
            text: texto,
            html: false,
          });
          return { ok: true, valor: target.text };
        } catch (error) {
          return {
            ok: false,
            motivo: `Bergamot no pudo traducir ${de} → ${a} (${error instanceof Error ? error.message : String(error)}).`,
          };
        }
      },
    },
  };
}

async function leerConRespaldo(url: string): Promise<unknown> {
  const cache = await caches.open(CACHE_DE_MODELOS);
  try {
    const respuesta = await fetch(url, { credentials: "omit" });
    if (respuesta.ok) {
      await cache.put(url, respuesta.clone());
      return await respuesta.json();
    }
  } catch (error) {
    // Sin red: se sigue con la copia guardada. Si tampoco hay copia, se informa abajo.
    const guardada = await cache.match(url);
    if (guardada) return guardada.json();
    throw new Error("Sin internet y sin la lista de modelos de Bergamot guardada", {
      cause: error,
    });
  }
  const guardada = await cache.match(url);
  if (guardada) return guardada.json();
  throw new Error("No se pudo descargar la lista de modelos de Bergamot");
}

function esModuloBergamot(modulo: unknown): modulo is ModuloBergamot {
  return (
    typeof modulo === "object" &&
    modulo !== null &&
    "LatencyOptimisedTranslator" in modulo &&
    typeof modulo.LatencyOptimisedTranslator === "function" &&
    "TranslatorBacking" in modulo &&
    typeof modulo.TranslatorBacking === "function"
  );
}
