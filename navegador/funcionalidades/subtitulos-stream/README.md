# subtitulos-stream

**Qué cubre:** Subtítulos para vMix/OBS: configurador de estilo por sala con vista previa y link fijo; página transparente que escala con la fuente.

**Qué NO hace:** Guardar el estilo en el link (va por sala en D1).

**Hoy:** `/sala/:id/subtitulos` (estilo de los subtítulos de una sala con vista previa y link fijo, guardado en D1) y `/sala/:id/transmision`, la página transparente de esa sala para vMix y OBS.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
