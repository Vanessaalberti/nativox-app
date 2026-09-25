# paneles

**Qué cubre:** Paneles de administrador, todo en uno y operador: salas, estado en vivo, accesos al calendario y al monitoreo.

**Qué NO hace:** Mostrar datos que el rol no puede ver.

**Hoy:** el panel del administrador en una sola página (Dashboard, Salas, Staff con roles separados, Producción y Ajustes): cada pestaña se arma la primera vez que se abre y después solo se oculta, así cambiar de pestaña es instantáneo; el segmento de la URL (`/panel/salas`…) solo decide con cuál se abre. Y el del operador (`/operador`: sus salas, con el calendario en solo lectura y el acceso en vivo).

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
