# produccion — Durable Object de las salidas de producción

**Qué hace:** guarda, por evento, las salidas de producción (nombre, estilo y qué sala está al aire) y avisa cada cambio a las páginas de las salidas (`/produccion/salida-:n`) por WebSocket. La página de la salida se conecta a la sala al aire (mismo reparto que la audiencia) y cambia de sala sin recargar, así OBS/vMix no se tocan.

**Qué NO hace:** transcribir ni reenviar subtítulos (eso lo hace el Durable Object de cada sala).

**Hoy:** sigue siendo un esqueleto. Las salidas viven en D1 (`salida`) y la página de cada salida pregunta cada 2 segundos qué sala está al aire; este objeto reemplazaría esa consulta por un aviso al instante.

**Archivos previstos:** `produccion.ts` · `salidas.ts`.
