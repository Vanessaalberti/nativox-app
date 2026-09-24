# sala — Durable Object de cada sala

**Qué hace:**
- **Reparto** con WebSocket Hibernation: la computadora de la sala publica cada línea **una vez** (original + todas las traducciones de la sala) y el objeto la reenvía a la audiencia, a vMix/OBS y al componente embebible. Cada espectador muestra el idioma que eligió; nadie genera nada extra por espectador.
- **Un solo dueño** por sala (quién captura) y **equipo de reserva** que toma la sala si el dueño no vuelve.
- **Señales:** recibe el heartbeat; una **alarma** (`setAlarm`) detecta si la sala se calló (~30 s) y avisa con `servidor/modulos/avisos`.
- **Agenda:** la misma alarma (una sola por objeto, con los eventos pendientes guardados) avisa "empieza/termina la charla X".
- **Comandos** a la pestaña: reiniciar, pasar a la nube, silenciar avisos.
- Historial reciente para quien entra tarde; métricas para el monitoreo.

**Qué NO hace:** transcribir ni traducir; guardar el historial completo (eso va a D1).

**Archivos previstos:** `sala.ts` · `reparto.ts` · `dueno.ts` · `vida.ts` · `alarma-agenda.ts` · `comandos.ts`.
