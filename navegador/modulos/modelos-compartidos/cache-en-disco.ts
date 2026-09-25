// Caché de modelos en el sistema de archivos privado del navegador (OPFS), con la interfaz que
// Transformers.js acepta como `env.customCache`. La Cache API no alcanza: medido el 24/09, el
// navegador rechaza guardar una entrada de 450 MB ("Unexpected internal error") y el codificador
// de Whisper pesa 425 MB, así que se volvía a descargar cada vez y no andaba sin internet.
//
// Cada archivo se escribe por partes (no ocupa 425 MB de memoria de una vez) y, al terminar, se
// deja una marca: un archivo a medio bajar (se cortó la luz o la red) nunca cuenta como guardado.

type AlAvanzar = (datos: { progress: number; loaded: number; total: number }) => void;

export interface CacheEnDisco {
  match(clave: string): Promise<Response | undefined>;
  put(clave: string, respuesta: Response, alAvanzar?: AlAvanzar): Promise<void>;
}

const SUFIJO_COMPLETO = ".completo";

export function crearCacheEnDisco(nombreCarpeta: string): CacheEnDisco {
  const carpeta = navigator.storage
    .getDirectory()
    .then((raiz) => raiz.getDirectoryHandle(nombreCarpeta, { create: true }));

  return {
    async match(clave) {
      const directorio = await carpeta;
      const nombre = await nombreDe(clave);
      const [archivo, completo] = await Promise.all([
        buscarArchivo(directorio, nombre),
        buscarArchivo(directorio, nombre + SUFIJO_COMPLETO),
      ]);
      if (!archivo || !completo) return undefined;
      const contenido = await archivo.getFile();
      return new Response(contenido, { headers: { "content-length": String(contenido.size) } });
    },

    async put(clave, respuesta, alAvanzar) {
      const directorio = await carpeta;
      const nombre = await nombreDe(clave);
      await directorio.removeEntry(nombre + SUFIJO_COMPLETO).catch(ignorarSiNoExiste);
      const escritura = await (
        await directorio.getFileHandle(nombre, { create: true })
      ).createWritable();
      const total = Number(respuesta.headers.get("content-length") ?? 0);
      let cargado = 0;
      const lector = respuesta.body?.getReader();
      for (let parte = await lector?.read(); parte && !parte.done; parte = await lector?.read()) {
        await escritura.write(parte.value);
        cargado += parte.value.byteLength;
        alAvanzar?.({ progress: total > 0 ? (cargado / total) * 100 : 0, loaded: cargado, total });
      }
      await escritura.close();
      await directorio.getFileHandle(nombre + SUFIJO_COMPLETO, { create: true });
    },
  };
}

async function buscarArchivo(directorio: FileSystemDirectoryHandle, nombre: string) {
  try {
    return await directorio.getFileHandle(nombre);
  } catch (error) {
    ignorarSiNoExiste(error);
    return null;
  }
}

// Que no exista es lo esperable (todavía no se bajó); cualquier otra falla sí se informa.
function ignorarSiNoExiste(error: unknown): void {
  if (error instanceof DOMException && error.name === "NotFoundError") return;
  throw error;
}

// Las claves son URLs: se guardan con su SHA-256 para tener nombres de archivo válidos.
async function nombreDe(clave: string): Promise<string> {
  const resumen = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clave));
  return Array.from(new Uint8Array(resumen), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
