import type { AlmacenAjustes } from "./almacen-ajustes";

export function crearAlmacenAjustesD1(db: D1Database): AlmacenAjustes {
  return {
    async leer(clave) {
      const fila = await db
        .prepare("SELECT valor FROM ajuste WHERE clave = ?")
        .bind(clave)
        .first<{ valor: string }>();
      return fila?.valor ?? null;
    },
    async guardar(clave, valor) {
      await db
        .prepare(
          "INSERT INTO ajuste (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor",
        )
        .bind(clave, valor)
        .run();
    },
    async borrar(clave) {
      await db.prepare("DELETE FROM ajuste WHERE clave = ?").bind(clave).run();
    },
    async borrarTodo() {
      await db.prepare("DELETE FROM ajuste").run();
    },
  };
}
