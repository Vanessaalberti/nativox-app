import type { Operador } from "@compartido/contratos";

// El equipo que opera las salas. Las implementaciones son D1 (la real) y la de memoria (pruebas).
// Los "cambiar" y "borrar" devuelven false si la persona no existe.
export interface AlmacenOperadores {
  listarOperadores: () => Promise<Operador[]>;
  leerOperador: (id: number) => Promise<Operador | null>;
  // Crea a las personas con sus salas, todas o ninguna. Devuelve el id de cada una, en orden.
  crearOperadores: (
    personas: { nombre: string; codigoHash: string; salaIds: readonly string[] }[],
    ahora: number,
  ) => Promise<number[]>;
  actualizarOperador: (id: number, nombre: string, salaIds: readonly string[]) => Promise<boolean>;
  cambiarCodigo: (id: number, codigoHash: string) => Promise<boolean>;
  borrarOperador: (id: number) => Promise<boolean>;
  // Quién es la persona del código (null si el código no existe o fue reemplazado).
  buscarPorCodigo: (codigoHash: string) => Promise<{ id: number } | null>;
  registrarIngreso: (id: number, ahora: number) => Promise<void>;
  salasDe: (id: number) => Promise<string[]>;
  borrarTodo: () => Promise<void>;
}
