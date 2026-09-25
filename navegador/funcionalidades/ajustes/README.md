# ajustes

**Qué cubre:** "Salas sin nadie al lado" (webhook de Discord con prueba, qué avisar, autorreparación, agenda, equipo de reserva, lista de control), consumo de IA, calidad de la traducción, acceso, instancia, eliminar evento; confirmación de links de acción (`/accion/:token`).

**Qué NO hace:** Mostrar el webhook guardado: es un secreto.

**Hoy:** la pestaña Ajustes del panel: General (nombre, logo y fechas), «Salas sin nadie al lado» (webhook de Discord, Slack o Google Chat con prueba, qué avisar, autorreparación, arranque con la agenda y equipo de reserva, lista de control), Consumo de IA (nube como respaldo, plan Workers Paid, tope mensual y avisos), Subtítulos, Tu acceso (cambiar contraseña y código de recuperación), Tu instancia y Eliminar el evento. Las preferencias se guardan; la reparación automática ya se aplica en la sesión en vivo. También `/accion/:token`: el botón de un aviso (reiniciar la sala o silenciar los avisos), que se abre sin sesión, se confirma y se usa una sola vez. **Pendiente:** el arranque automático con la agenda, el equipo de reserva y pasar a la nube (se guardan como preferencia, pero no se aplican), y medir el consumo real de IA (la app todavía no usa la nube).

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
