export interface Equipo {
  webgpu: boolean;
  // `shader-f16`: con eso Whisper corre con el codificador sin comprimir (fp16).
  f16: boolean;
  // Lo que el navegador quiere decir de la placa; algunos lo ocultan.
  placa: string | null;
  // Chrome lo redondea y lo topea en 8 GB: sirve como pista, no como medida.
  memoriaGb: number | null;
  nucleos: number | null;
}

const SIN_WEBGPU: Equipo = {
  webgpu: false,
  f16: false,
  placa: null,
  memoriaGb: null,
  nucleos: null,
};

export async function detectarEquipo(): Promise<Equipo> {
  const memoria = "deviceMemory" in navigator ? Number(navigator.deviceMemory) : NaN;
  const generales = {
    memoriaGb: Number.isFinite(memoria) ? memoria : null,
    nucleos: navigator.hardwareConcurrency > 0 ? navigator.hardwareConcurrency : null,
  };
  if (!("gpu" in navigator)) return { ...SIN_WEBGPU, ...generales };

  // Un error al pedir la placa (drivers, políticas del navegador) es lo mismo que no tenerla.
  const adaptador = await navigator.gpu.requestAdapter().catch(() => null);
  if (!adaptador) return { ...SIN_WEBGPU, ...generales };

  return {
    webgpu: true,
    f16: adaptador.features.has("shader-f16"),
    placa: nombreDeLaPlaca(adaptador.info),
    ...generales,
  };
}

function nombreDeLaPlaca(info: GPUAdapterInfo): string | null {
  if (info.description !== "") return info.description;
  const partes = [info.vendor, info.architecture].filter((parte) => parte !== "");
  return partes.length > 0 ? partes.join(" ") : null;
}
