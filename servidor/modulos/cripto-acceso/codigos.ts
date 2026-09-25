import { aHex } from "./hex";

// Sin caracteres ambiguos (0/O, 1/I/L) para poder copiar el código a mano sin errores.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const codificador = new TextEncoder();

// Elige `cantidad` caracteres del alfabeto sin sesgo: los bytes que caerían en la parte "sobrante"
// se descartan y se piden otros.
function caracteresAlAzar(cantidad: number): string {
  const limite = 256 - (256 % ALFABETO.length);
  let salida = "";
  while (salida.length < cantidad) {
    for (const byte of crypto.getRandomValues(new Uint8Array(cantidad * 2))) {
      if (byte < limite && salida.length < cantidad)
        salida += ALFABETO.charAt(byte % ALFABETO.length);
    }
  }
  return salida;
}

// XXXX-XXXX-XXXX-XXXX (80 bits): se muestra una sola vez y en la base queda solo su hash.
export function generarCodigoDeRecuperacion(): string {
  return caracteresAlAzar(16).replace(/(.{4})(?=.)/g, "$1-");
}

// El código se escribe a mano: se ignoran mayúsculas, guiones y espacios.
export function normalizarCodigo(codigo: string): string {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function hashearCodigo(codigo: string): Promise<string> {
  const resumen = await crypto.subtle.digest(
    "SHA-256",
    codificador.encode(normalizarCodigo(codigo)),
  );
  return aHex(new Uint8Array(resumen));
}

// Token de sesión: 256 bits al azar. El navegador guarda el token y la base solo su hash.
export function generarToken(): string {
  return aHex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashearToken(token: string): Promise<string> {
  const resumen = await crypto.subtle.digest("SHA-256", codificador.encode(token));
  return aHex(new Uint8Array(resumen));
}
