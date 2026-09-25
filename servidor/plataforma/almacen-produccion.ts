import type { DatosDeSalida, EstiloSalida, SalidaDeProduccion } from "@compartido/contratos";

// El estilo de los subtítulos de cada sala y las salidas de producción. Las implementaciones son D1
// (la real) y la de memoria (pruebas). Los "cambiar" y "borrar" devuelven false si no existe.
export interface AlmacenProduccion {
  // null si la sala todavía no tiene un estilo propio.
  leerEstiloDeSala: (salaId: string) => Promise<EstiloSalida | null>;
  guardarEstiloDeSala: (salaId: string, estilo: EstiloSalida) => Promise<boolean>;
  listarSalidas: () => Promise<SalidaDeProduccion[]>;
  leerSalida: (numero: number) => Promise<SalidaDeProduccion | null>;
  // Crea la salida con el siguiente número libre y la devuelve.
  crearSalida: (nombre: string, estilo: EstiloSalida, ahora: number) => Promise<SalidaDeProduccion>;
  actualizarSalida: (numero: number, datos: DatosDeSalida) => Promise<boolean>;
  borrarSalida: (numero: number) => Promise<boolean>;
  borrarTodo: () => Promise<void>;
}
