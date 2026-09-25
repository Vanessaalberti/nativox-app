import type { Resultado } from "@compartido/contratos";

// Todo lo que este sitio guardó en el navegador para funcionar sin internet: los modelos en OPFS
// (Whisper y ONNX Runtime) y en la Cache API (Bergamot). Solo toca los datos de este origen.
export async function medirGuardados(): Promise<number> {
  const { usage = 0 } = await navigator.storage.estimate();
  return usage;
}

export async function borrarGuardados(): Promise<Resultado<{ bytesLiberados: number }>> {
  const antes = await medirGuardados();
  try {
    for (const nombre of await caches.keys()) await caches.delete(nombre);
    const raiz = await navigator.storage.getDirectory();
    for await (const nombre of raiz.keys()) await raiz.removeEntry(nombre, { recursive: true });
  } catch (error) {
    return {
      ok: false,
      motivo: `No se pudo borrar todo (${error instanceof Error ? error.message : String(error)}). Cerrá las otras pestañas de este sitio y probá de nuevo.`,
    };
  }
  return { ok: true, valor: { bytesLiberados: Math.max(0, antes - (await medirGuardados())) } };
}
