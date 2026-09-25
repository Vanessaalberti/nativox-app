# operadores

**Qué cubre:** Operadores: invitaciones con código, asignación de salas, revocar.

**Qué NO hace:** Mostrar secretos ni consumo a los operadores.

**Hoy:** la pestaña Operadores del panel (solo con roles separados): agregar una o varias personas con sus salas, cambiar las salas de cada una, generar un código nuevo (el anterior deja de servir) y eliminar. Los códigos (NTVX-XXXX-XXXX-XXXX) se muestran una sola vez: el servidor guarda solo su hash. Una persona pasa de "Invitado" a "Activo" cuando entra. El panel del operador (`/operador`) está en `paneles`.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
