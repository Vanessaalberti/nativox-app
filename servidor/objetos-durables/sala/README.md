# sala — Durable Object de cada sala

**Qué hace:**
- **Reparto** con WebSocket Hibernation: la computadora de la sala publica cada línea **una vez** (original + todas las traducciones de la sala) y el objeto la reenvía a la audiencia, a vMix/OBS y al componente embebible. Cada espectador muestra el idioma que eligió; nadie genera nada extra por espectador.
- **Un solo dueño** por sala (quién captura) y **equipo de reserva** que toma la sala si el dueño no vuelve.
- **Señales:** recibe el heartbeat; una **alarma** (`setAlarm`) detecta si la sala se calló (~30 s) y avisa con `servidor/modulos/avisos`.
- **Agenda:** la misma alarma (una sola por objeto, con los eventos pendientes guardados) avisa "empieza/termina la charla X".
- **Comandos** a la pestaña: reiniciar, pasar a la nube, silenciar avisos.
- Historial reciente para quien entra tarde; métricas para el monitoreo.

**Qué NO hace:** transcribir ni traducir; guardar el historial completo (eso va a D1).

**Hoy:** el reparto por WebSocket con Hibernation (publicador, espectador y monitor; un solo dueño por sala), el historial de las últimas 300 líneas para quien entra tarde, la última señal y `resumen()` (si está en vivo y cuántos miran). También la alarma que cada 15 s mira si la sala sigue dando señal (más de 30 s sin señal: avisa una sola vez por corte, con links de un solo uso para reiniciarla o silenciar los avisos, y avisa cuando vuelve), el aviso de empieza y termina cada charla, y el guardado en D1 de cada frase confirmada asociada a la charla en curso. Pendiente: el equipo de reserva.

**Archivos previstos:** `sala.ts` · `reparto.ts` · `dueno.ts` · `vida.ts` · `alarma-agenda.ts` · `comandos.ts`.
