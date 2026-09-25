// Los días de la agenda son fechas AAAA-MM-DD sin zona horaria (la hora local del evento). Las
// cuentas se hacen en UTC para que un cambio de horario de verano no corra ningún día.

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

export const NOMBRES_DE_DIA = DIAS;

const aFecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
const aIso = (fecha: Date) => fecha.toISOString().slice(0, 10);

export function sumarDias(iso: string, dias: number): string {
  const fecha = aFecha(iso);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return aIso(fecha);
}

// El lunes de la semana de esa fecha (la semana empieza el lunes).
export function lunesDe(iso: string): string {
  return sumarDias(iso, -((aFecha(iso).getUTCDay() + 6) % 7));
}

export function semanaDesde(lunes: string): string[] {
  return DIAS.map((_, indice) => sumarDias(lunes, indice));
}

// La fecha de hoy en la computadora de quien mira (no en UTC: a las 22 h de Argentina ya es
// "mañana" en UTC).
export function hoy(ahora = new Date()): string {
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${String(ahora.getFullYear())}-${mes}-${dia}`;
}

export function diaCorto(iso: string): string {
  const [, mes = "", dia = ""] = iso.split("-");
  return `${dia}/${mes}`;
}

export function nombreDelDia(iso: string): string {
  return DIAS[(aFecha(iso).getUTCDay() + 6) % 7] ?? "";
}

// 570 → "09:30"; 1440 → "24:00".
export function formatearMinutos(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

// Si la charla ya terminó, según el reloj de quien mira (la agenda es en hora local, sin zona).
export function haTerminado(fecha: string, finMin: number, ahora = new Date()): boolean {
  const [anio = 0, mes = 1, dia = 1] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia, 0, finMin).getTime() <= ahora.getTime();
}
