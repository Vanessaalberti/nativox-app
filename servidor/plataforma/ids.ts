// Identificadores cortos para salas y charlas: 12 caracteres hexadecimales (48 bits) alcanzan para
// las decenas de salas y cientos de charlas de un evento, y se ven bien en una dirección.
export function crearId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 12);
}
