# monitoreo

**Qué cubre:** Monitoreo de sala: equipo, última señal, nivel de audio, latencia, errores, registro de eventos, lo que llegó a Discord, acciones a distancia (reiniciar, nube, reserva, silenciar) y modo caos.

**Qué NO hace:** Ejecutar las acciones: las pide al servidor, que las manda a la sala.

**Hoy:** `/sala/:id/monitoreo`: si la computadora está conectada, última señal, nivel de audio, latencia promedio, oyentes, registro de eventos, y las acciones «Reiniciar», «Pasar a la nube» y «Silenciar avisos» (las pide este panel; «reiniciar» lo ejecuta la computadora de la sala y «silenciar avisos» la propia sala; «pasar a la nube» todavía no se ejecuta). El modo caos es una demostración local: no toca la sala real. El equipo de reserva no está. Los avisos a Discord salen de la propia sala (con el nivel de audio real que manda la computadora).

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
