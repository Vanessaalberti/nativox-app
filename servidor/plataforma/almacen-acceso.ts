import type { ActualizarEvento, DatosEvento, TipoDeEvento } from "@compartido/contratos";

export type Rol = "administrador" | "operador";

export interface Administrador {
  email: string;
  contrasenaHash: string;
  codigoRecuperacionHash: string;
}

export interface EventoGuardado {
  tipo: TipoDeEvento;
  nombre: string;
  logo: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  salasSimultaneas: number;
  horasPorDia: number;
  dias: number;
  nubeComoRespaldo: boolean;
}

export interface SesionGuardada {
  rol: Rol;
  cuentaId: number;
}

// Lo que el acceso necesita guardar. Las implementaciones son D1 (la real) y la de memoria (pruebas).
// Los "crear" devuelven false si ya había uno: el primero que llega queda como dueño.
export interface AlmacenAcceso {
  leerAdministrador: () => Promise<Administrador | null>;
  crearAdministrador: (administrador: Administrador, ahora: number) => Promise<boolean>;
  cambiarCredenciales: (credenciales: Omit<Administrador, "email">) => Promise<void>;
  leerEvento: () => Promise<EventoGuardado | null>;
  crearEvento: (evento: DatosEvento, ahora: number) => Promise<boolean>;
  actualizarEvento: (
    cambios: ActualizarEvento & { nubeComoRespaldo?: boolean },
  ) => Promise<boolean>;
  // Elimina el evento, la cuenta del administrador, las sesiones y los intentos de ingreso.
  borrarTodo: () => Promise<void>;
  guardarSesion: (
    tokenHash: string,
    sesion: SesionGuardada,
    creadaEn: number,
    venceEn: number,
  ) => Promise<void>;
  leerSesion: (tokenHash: string, ahora: number) => Promise<SesionGuardada | null>;
  borrarSesion: (tokenHash: string) => Promise<void>;
  borrarSesionesDe: (rol: Rol, cuentaId: number) => Promise<void>;
  contarIntentos: (clave: string, desde: number) => Promise<number>;
  registrarIntento: (clave: string, ahora: number) => Promise<void>;
  borrarIntentos: (clave: string) => Promise<void>;
}
