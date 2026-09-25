# paneles

**Qué cubre:** Paneles de administrador, todo en uno y operador: salas, estado en vivo, accesos al calendario y al monitoreo.

**Qué NO hace:** Mostrar datos que el rol no puede ver.

**Hoy:** el panel del administrador (Resumen, Salas y, con roles separados, Operadores) y el del operador (`/operador`: sus salas, con el calendario en solo lectura y el acceso en vivo). Falta el monitoreo.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
