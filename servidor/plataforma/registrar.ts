// El único lugar que escribe en los registros del Worker: JSON de una línea, sin datos de quien
// usa la instancia (ni audio ni texto ni IP).
export function registrarError(mensaje: string, causa: unknown): void {
  // eslint-disable-next-line no-console -- los registros del Worker son la salida prevista
  console.error(
    JSON.stringify({
      nivel: "error",
      mensaje,
      causa: causa instanceof Error ? causa.message : String(causa),
    }),
  );
}
