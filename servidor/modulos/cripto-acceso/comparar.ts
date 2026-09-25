// Compara sin cortar en la primera diferencia, para que el tiempo no delate cuántos caracteres
// coinciden.
export function compararEnTiempoConstante(a: string, b: string): boolean {
  const largo = Math.max(a.length, b.length);
  let diferencia = a.length ^ b.length;
  for (let i = 0; i < largo; i += 1) {
    diferencia |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diferencia === 0;
}
