# produccion

**Qué cubre:** Pestaña Producción (opcional; en todo en uno es una pestaña más, con roles separados la tiene el administrador): salidas con **un link fijo cada una** para vMix/OBS, selector de salas (clic o teclas 1–9 para poner una sala al aire, "Sin subtítulos"), estilo por salida (idioma, líneas, posición, original), vista previa del programa y registro de qué estuvo al aire. Incluye la página transparente de cada salida (`/produccion/salida-:n`), que se conecta a la sala al aire y cambia sin recargar.

**Qué NO hace:** Reemplazar el link por sala de `subtitulos-stream`: los dos conviven. No la ven los operadores.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
