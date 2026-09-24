# sesion-en-vivo

**Qué cubre:** Controla una sala en vivo: fuente de audio, idiomas, iniciar/pausar/finalizar, barra de velocidad, traductor, "Evaluar esta computadora", modo desatendido, nube de respaldo. Conecta `flujo-subtitulos` con `cliente-sala` y `autorreparacion`.

**Qué NO hace:** Implementar la transcripción o la traducción: usa `modulos/`.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
