// Mandar un texto a un canal (Discord, Slack o Google Chat) por su webhook. La API no conoce cómo:
// en producción es un fetch; en las pruebas, un falso.
export interface Avisos {
  // true si el canal lo aceptó.
  enviar: (direccion: string, texto: string) => Promise<boolean>;
}
