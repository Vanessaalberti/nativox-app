import type { Resultado } from "@compartido/contratos";
import type { VarianteWhisper } from "./protocolo";

// Con `shader-f16` el codificador va sin comprimir (fp16); sin eso, comprimido (q4). El fp32 de
// un solo archivo de 2,55 GB no carga en el navegador: nunca se ofrece.
export async function elegirVarianteWhisper(): Promise<Resultado<VarianteWhisper>> {
  if (!("gpu" in navigator)) {
    return {
      ok: false,
      motivo: "Este navegador no tiene WebGPU. Usá Chrome 124 o posterior (o Edge) actualizado.",
    };
  }
  const adaptador = await navigator.gpu.requestAdapter();
  if (!adaptador) {
    return {
      ok: false,
      motivo: "No se encontró una placa de video compatible con WebGPU en esta computadora.",
    };
  }
  return { ok: true, valor: adaptador.features.has("shader-f16") ? "fp16" : "q4" };
}
