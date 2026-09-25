# salas

**Qué cubre:** Alta, edición y listado de salas (de a una o en cantidad), con los idiomas a los que se traduce cada una.

**Qué NO hace:** Controlar la sesión en vivo (eso es `sesion-en-vivo`).

**Hoy:** la pestaña Salas del panel: crear una sala o varias de una (hasta 60, con nombre y idiomas), editar y eliminar (con sus charlas, previa confirmación), y los accesos al calendario y a la sesión en vivo de cada una. Los idiomas elegidos al crear valen para todas las del lote. Los operadores asignados a cada sala llegan con los operadores.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
