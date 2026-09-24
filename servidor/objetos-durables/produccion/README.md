# produccion — Durable Object de las salidas de producción

**Qué hace:** guarda, por evento, las salidas de producción (nombre, estilo y qué sala está al aire) y avisa cada cambio a las páginas de las salidas (`/produccion/salida-:n`) por WebSocket. La página de la salida se conecta a la sala al aire (mismo reparto que la audiencia) y cambia de sala sin recargar, así OBS/vMix no se tocan.

**Qué NO hace:** transcribir ni reenviar subtítulos (eso lo hace el Durable Object de cada sala).

**Archivos previstos:** `produccion.ts` · `salidas.ts`.
