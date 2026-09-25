// La sala "está en vivo" si hay una computadora publicando y su última señal es reciente.
export const VIGENCIA_DE_LA_SENAL_MS = 45_000;

export function estaEnVivo(publicando: number, senalEn: number | null, ahora: number): boolean {
  return publicando > 0 && senalEn !== null && ahora - senalEn <= VIGENCIA_DE_LA_SENAL_MS;
}
