# monitoreo

**Qué cubre:** Monitoreo de sala: equipo, última señal, nivel de audio, latencia, errores, registro de eventos, lo que llegó a Discord, acciones a distancia (reiniciar, nube, reserva, silenciar) y modo caos.

**Qué NO hace:** Ejecutar las acciones: las pide al servidor, que las manda a la sala.

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
