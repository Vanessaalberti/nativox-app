import { compararEnTiempoConstante } from "./comparar";
import { aHex, deHex } from "./hex";

// Workers limita PBKDF2 a 100.000 iteraciones por llamada: es el máximo permitido y el que se usa.
const ITERACIONES = 100_000;
const BYTES_DE_SAL = 16;
const BYTES_DE_HASH = 32;
const ALGORITMO = "pbkdf2-sha256";

const codificador = new TextEncoder();

async function derivar(
  contrasena: string,
  sal: Uint8Array<ArrayBuffer>,
  iteraciones: number,
): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    "raw",
    codificador.encode(contrasena),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iteraciones },
    material,
    BYTES_DE_HASH * 8,
  );
  return new Uint8Array(bits);
}

// Formato guardado: pbkdf2-sha256$iteraciones$sal$hash (sal y hash en hexadecimal).
export async function hashearContrasena(contrasena: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(BYTES_DE_SAL));
  const hash = await derivar(contrasena, sal, ITERACIONES);
  return `${ALGORITMO}$${String(ITERACIONES)}$${aHex(sal)}$${aHex(hash)}`;
}

export async function verificarContrasena(contrasena: string, guardado: string): Promise<boolean> {
  const [algoritmo, iteraciones, sal, hash] = guardado.split("$");
  const cantidad = Number(iteraciones);
  const salEnBytes = deHex(sal ?? "");
  if (algoritmo !== ALGORITMO || !Number.isInteger(cantidad) || cantidad < 1 || !salEnBytes) {
    return false;
  }
  const calculado = await derivar(contrasena, salEnBytes, Math.min(cantidad, ITERACIONES));
  return compararEnTiempoConstante(aHex(calculado), hash ?? "");
}
