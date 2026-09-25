# audiencia

**Qué cubre:** Vista de la audiencia: elegir sala e idioma y seguir los subtítulos, con historial para quien entra tarde. Solo recibe texto ya generado por la sala: **no corre ningún modelo** y cambiar de idioma es instantáneo.

**Qué NO hace:** Pedir cuenta ni permiso de micrófono.

**Hoy:** `/audiencia` (elegir sala, con su estado y su agenda del día) y `/sala/:id/pantalla` (elegir idioma y seguir la transcripción en vivo, con el historial reciente para quien entra tarde). Es público: no pide cuenta.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
