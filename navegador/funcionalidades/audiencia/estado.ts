import type { CharlaPublica, SalaPublica } from "@compartido/contratos";

export type EstadoDeSala = "en-vivo" | "proximamente" | "inactiva";

const dosDigitos = (numero: number) => String(numero).padStart(2, "0");

// AAAA-MM-DD de la fecha local (la de la computadora de quien mira, no la de UTC).
export function fechaDeHoy(ahora: Date): string {
  return `${String(ahora.getFullYear())}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}`;
}

const minutosDelDia = (ahora: Date) => ahora.getHours() * 60 + ahora.getMinutes();

function formatearMinutos(minutos: number): string {
  return `${dosDigitos(Math.floor(minutos / 60))}:${dosDigitos(minutos % 60)}`;
}

export const rango = (charla: CharlaPublica) =>
  `${formatearMinutos(charla.inicioMin)} – ${formatearMinutos(charla.finMin)}`;

// Las charlas de hoy y, si hoy no hay ninguna, las del próximo día que tenga (así la audiencia
// siempre ve algo cuando el evento es otro día).
export function charlasParaMostrar(charlas: readonly CharlaPublica[], ahora: Date) {
  const hoy = fechaDeHoy(ahora);
  const deHoy = charlas.filter((charla) => charla.fecha === hoy);
  if (deHoy.length > 0) return { fecha: hoy, charlas: deHoy };
  const proxima = charlas.find((charla) => charla.fecha > hoy);
  return proxima
    ? { fecha: proxima.fecha, charlas: charlas.filter((charla) => charla.fecha === proxima.fecha) }
    : { fecha: hoy, charlas: [] };
}

// "En vivo" si la computadora de la sala manda subtítulos; "Próximamente" si le queda alguna charla
// hoy; si no, "Inactiva".
export function estadoDeSala(sala: SalaPublica, ahora: Date): EstadoDeSala {
  if (sala.enVivo) return "en-vivo";
  const hoy = fechaDeHoy(ahora);
  const minutos = minutosDelDia(ahora);
  const quedan = sala.charlas.some((charla) => charla.fecha === hoy && charla.finMin > minutos);
  return quedan ? "proximamente" : "inactiva";
}

// La charla que toca ahora en la sala, si hay una.
export function charlaDeAhora(sala: SalaPublica, ahora: Date): CharlaPublica | null {
  const hoy = fechaDeHoy(ahora);
  const minutos = minutosDelDia(ahora);
  return (
    sala.charlas.find(
      (charla) => charla.fecha === hoy && charla.inicioMin <= minutos && minutos < charla.finMin,
    ) ?? null
  );
}
