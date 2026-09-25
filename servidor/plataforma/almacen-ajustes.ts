// Los ajustes del administrador, uno por clave ("general", "webhook"). Las implementaciones son D1
// (la real) y la de memoria (pruebas).
export interface AlmacenAjustes {
  leer: (clave: string) => Promise<string | null>;
  guardar: (clave: string, valor: string) => Promise<void>;
  borrar: (clave: string) => Promise<void>;
  borrarTodo: () => Promise<void>;
}
