# acceso

**Qué cubre:** Entrada de administrador (email + contraseña, código de recuperación) y de operador (código de invitación); redirección según el rol; pantalla sin acceso.

**Qué NO hace:** Decidir permisos: la autorización real la hace el servidor.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
