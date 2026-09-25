import type { Ajustes } from "@compartido/contratos";

// Cuánto tiempo sin señal hace que una sala se considere caída y se avise.
const SEGUNDOS_SIN_SENAL = 30;

export type TipoDeAviso = "sin-senal" | "recuperada" | "charla" | "accion";

// Lo que la sala hace en cada vuelta de su alarma: avisar que se cayó, avisar que volvió o nada.
// Una sala "está caída" si hay una computadora conectada que dejó de mandar señal, o si estuvo
// dando señal y la computadora se desconectó del todo.
export type Evaluacion = "avisar-caida" | "avisar-recuperacion" | "nada";

export function evaluarSenal(estado: {
  senalEn: number | null;
  ahora: number;
  enAlerta: boolean;
  // Si alguna vez hubo una computadora publicando en esta sala (no se avisa de una sala que nunca arrancó).
  hubo: boolean;
}): Evaluacion {
  if (estado.senalEn === null || !estado.hubo) return "nada";
  const segundosSinSenal = (estado.ahora - estado.senalEn) / 1000;
  const caida = segundosSinSenal > SEGUNDOS_SIN_SENAL;
  if (caida && !estado.enAlerta) return "avisar-caida";
  if (!caida && estado.enAlerta) return "avisar-recuperacion";
  return "nada";
}

// Lo que no se pudo reparar se avisa siempre; el resto, según lo que el administrador eligió.
export function debeAvisar(tipo: TipoDeAviso, ajustes: Ajustes["avisar"]): boolean {
  switch (tipo) {
    case "sin-senal":
    case "recuperada":
    case "accion":
      return true;
    case "charla":
      return ajustes.charlas;
  }
}

export const estaSilenciado = (silenciadoHasta: number | null, ahora: number): boolean =>
  silenciadoHasta !== null && ahora < silenciadoHasta;

export const MINUTOS_DE_SILENCIO = 30;
