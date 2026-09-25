import type { Resultado } from "@compartido/contratos";

// Mide cuánto cálculo por segundo da la placa de video, sin bajar ningún modelo ni usar audio: una
// multiplicación de matrices (lo que más pesa en Whisper) en un shader de WebGPU. Es una
// estimación: no mide la memoria ni cada capa del modelo, pero ordena bien a las placas.
const LADO = 1024;
const VUELTAS = 10;
const VUELTAS_DE_CALENTAMIENTO = 2;
const TAMANO_DE_BLOQUE = 16;
// Las constantes de GPUBufferUsage (los tipos de WebGPU no las declaran como valores globales).
const USO_COPY_DST = 0x08;
const USO_STORAGE = 0x80;

const SHADER = /* wgsl */ `
@group(0) @binding(0) var<storage, read> a: array<f32>;
@group(0) @binding(1) var<storage, read> b: array<f32>;
@group(0) @binding(2) var<storage, read_write> c: array<f32>;

const N: u32 = ${String(LADO)}u;
const T: u32 = ${String(TAMANO_DE_BLOQUE)}u;
var<workgroup> ta: array<f32, ${String(TAMANO_DE_BLOQUE * TAMANO_DE_BLOQUE)}>;
var<workgroup> tb: array<f32, ${String(TAMANO_DE_BLOQUE * TAMANO_DE_BLOQUE)}>;

@compute @workgroup_size(${String(TAMANO_DE_BLOQUE)}, ${String(TAMANO_DE_BLOQUE)})
fn main(@builtin(global_invocation_id) g: vec3<u32>, @builtin(local_invocation_id) l: vec3<u32>) {
  var acc = 0.0;
  for (var t = 0u; t < N / T; t = t + 1u) {
    ta[l.y * T + l.x] = a[g.y * N + t * T + l.x];
    tb[l.y * T + l.x] = b[(t * T + l.y) * N + g.x];
    workgroupBarrier();
    for (var k = 0u; k < T; k = k + 1u) {
      acc = acc + ta[l.y * T + k] * tb[k * T + l.x];
    }
    workgroupBarrier();
  }
  c[g.y * N + g.x] = acc;
}
`;

// Si la placa no contesta a tiempo (drivers rotos, placa muy lenta), se corta en lugar de dejar la
// pestaña esperando para siempre.
const TOPE_DE_ESPERA_MS = 8000;

function conTope(promesa: Promise<unknown>): Promise<unknown> {
  let reloj: ReturnType<typeof setTimeout> | undefined;
  const tope = new Promise<never>((_resolver, rechazar) => {
    reloj = setTimeout(() => {
      rechazar(new Error("la placa tardó demasiado en contestar"));
    }, TOPE_DE_ESPERA_MS);
  });
  return Promise.race([promesa, tope]).finally(() => clearTimeout(reloj));
}

// Miles de millones de operaciones por segundo (GFLOPS) de la placa, en f32.
export async function medirRendimiento(): Promise<Resultado<{ gflops: number }>> {
  if (!("gpu" in navigator)) return { ok: false, motivo: "Este navegador no tiene WebGPU." };
  try {
    const adaptador = await navigator.gpu.requestAdapter();
    if (!adaptador) return { ok: false, motivo: "No se encontró una placa de video compatible." };
    const dispositivo = await adaptador.requestDevice();
    try {
      return { ok: true, valor: { gflops: await correr(dispositivo) } };
    } finally {
      dispositivo.destroy();
    }
  } catch (error) {
    return {
      ok: false,
      motivo: `No se pudo medir la placa (${error instanceof Error ? error.message : String(error)}).`,
    };
  }
}

async function correr(dispositivo: GPUDevice): Promise<number> {
  const bytes = LADO * LADO * 4;
  const datos = new Float32Array(LADO * LADO).map((_, i) => (i % 7) / 7);
  const crear = (uso: number) => dispositivo.createBuffer({ size: bytes, usage: uso });
  const a = crear(USO_STORAGE | USO_COPY_DST);
  const b = crear(USO_STORAGE | USO_COPY_DST);
  const c = crear(USO_STORAGE);
  dispositivo.queue.writeBuffer(a, 0, datos);
  dispositivo.queue.writeBuffer(b, 0, datos);

  const pipeline = dispositivo.createComputePipeline({
    layout: "auto",
    compute: { module: dispositivo.createShaderModule({ code: SHADER }), entryPoint: "main" },
  });
  const enlaces = dispositivo.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [a, b, c].map((buffer, binding) => ({ binding, resource: { buffer } })),
  });
  const grupos = LADO / TAMANO_DE_BLOQUE;

  const ejecutar = async (vueltas: number) => {
    const inicio = performance.now();
    const codificador = dispositivo.createCommandEncoder();
    const pasada = codificador.beginComputePass();
    pasada.setPipeline(pipeline);
    pasada.setBindGroup(0, enlaces);
    for (let i = 0; i < vueltas; i++) pasada.dispatchWorkgroups(grupos, grupos);
    pasada.end();
    dispositivo.queue.submit([codificador.finish()]);
    await conTope(dispositivo.queue.onSubmittedWorkDone());
    return (performance.now() - inicio) / 1000;
  };

  // Las primeras vueltas compilan el shader y calientan la placa: no cuentan.
  await ejecutar(VUELTAS_DE_CALENTAMIENTO);
  const segundos = await ejecutar(VUELTAS);
  const operaciones = 2 * LADO ** 3 * VUELTAS;
  return operaciones / segundos / 1e9;
}
