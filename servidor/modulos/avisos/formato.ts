// Los mensajes que llegan al canal (🟢 bien · 🟡 se resolvió solo · 🔴 falla · ✓ acción hecha).
// Van como texto: los links de acción son de un solo uso y vencen a los 15 minutos.
export const MINUTOS_DE_VIGENCIA_DE_LOS_LINKS = 15;

export function avisoSinSenal(datos: {
  sala: string;
  segundos: number;
  reiniciar: string;
  silenciar: string;
}): string {
  return [
    `🔴 ${datos.sala} — no da señal hace ${String(Math.round(datos.segundos))} s.`,
    `↻ Reiniciar la sala: ${datos.reiniciar}`,
    `🔕 Silenciar avisos ${String(30)} min: ${datos.silenciar}`,
    `(Los links son de un solo uso y vencen en ${String(MINUTOS_DE_VIGENCIA_DE_LOS_LINKS)} min.)`,
  ].join("\n");
}

export function avisoRecuperada(datos: { sala: string; segundos: number }): string {
  return `🟢 ${datos.sala} — volvió a dar señal después de ${String(Math.round(datos.segundos))} s.`;
}

export function avisoDeCharla(datos: {
  sala: string;
  titulo: string;
  momento: "empieza" | "termina";
  terminosDelGlosario?: number;
}): string {
  const glosario =
    datos.terminosDelGlosario && datos.terminosDelGlosario > 0
      ? ` · glosario cargado: ${String(datos.terminosDelGlosario)} términos`
      : "";
  return datos.momento === "empieza"
    ? `🟢 ${datos.sala} — empezó «${datos.titulo}»${glosario}`
    : `🟢 ${datos.sala} — terminó «${datos.titulo}»`;
}

export function avisoDeAccion(datos: {
  sala: string;
  accion: "reiniciar" | "pasar-a-la-nube" | "silenciar-avisos";
}): string {
  const que = {
    reiniciar: "se pidió reiniciar la sala",
    "pasar-a-la-nube": "se pidió pasar la transcripción a la nube",
    "silenciar-avisos": "se silenciaron los avisos por 30 minutos",
  }[datos.accion];
  return `✓ ${datos.sala} — ${que} desde un link de aviso.`;
}
