// El reparto en tiempo real de cada sala (el Durable Object), visto desde la API: la API no
// conoce la clase, solo estas dos operaciones.
export interface TiempoReal {
  // Le pasa el pedido de WebSocket (ya autorizado, con el rol en el encabezado X-Nativox-Rol) a la
  // sala y devuelve su respuesta.
  conectar: (salaId: string, pedido: Request) => Promise<Response>;
  // Si la computadora de la sala está mandando subtítulos ahora y cuántas personas la miran.
  resumen: (salaId: string) => Promise<{ enVivo: boolean; espectadores: number }>;
  // Le pide a la computadora de la sala (o a la propia sala, para silenciar) que haga algo. Devuelve
  // cuántas computadoras están conectadas: 0 quiere decir que nadie lo va a ejecutar.
  comando: (
    salaId: string,
    accion: "reiniciar" | "pasar-a-la-nube" | "silenciar-avisos",
  ) => Promise<{ publicando: number }>;
}

export const ENCABEZADO_DE_ROL = "X-Nativox-Rol";

// Qué sala es: la API se lo dice al Durable Object, que la necesita para avisar y para guardar la
// transcripción (la alarma corre sin ningún pedido).
export const ENCABEZADO_DE_SALA = "X-Nativox-Sala";
