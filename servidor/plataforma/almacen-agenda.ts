import type { Charla, DatosDeCharla, DatosDeSala, Sala } from "@compartido/contratos";

// Las salas y sus charlas. Las implementaciones son D1 (la real) y la de memoria (pruebas). Los
// "actualizar" y "borrar" devuelven false si lo pedido no existe.
export interface AlmacenAgenda {
  crearSalas: (salas: (DatosDeSala & { id: string })[], ahora: number) => Promise<void>;
  listarSalas: () => Promise<Sala[]>;
  leerSala: (id: string) => Promise<Sala | null>;
  actualizarSala: (id: string, datos: DatosDeSala) => Promise<boolean>;
  // Borra también sus charlas.
  borrarSala: (id: string) => Promise<boolean>;
  listarCharlas: (salaId: string) => Promise<Charla[]>;
  leerCharla: (id: string) => Promise<Charla | null>;
  crearCharla: (id: string, salaId: string, datos: DatosDeCharla, ahora: number) => Promise<void>;
  actualizarCharla: (id: string, datos: DatosDeCharla) => Promise<boolean>;
  borrarCharla: (id: string) => Promise<boolean>;
}
