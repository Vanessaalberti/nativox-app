# agenda

**Qué cubre:** Calendario de la sala: charlas con horario, idioma, resumen y oradores; glosario por charla; "Sugerir términos" (se aceptan a mano); arranque y parada por agenda; transcripción de las charlas terminadas para copiar o descargar con corrimiento de tiempo.

**Qué NO hace:** Transcribir (eso lo hace `sesion-en-vivo` con los módulos).

**Hoy:** el calendario semanal de la sala (`/sala/:id/calendario`): crear charlas con un clic en un espacio vacío o con el botón, editarlas y eliminarlas; título, resumen, oradores, día, horario (de a 15 minutos) e idioma; el servidor no deja dos charlas a la vez en una misma sala. El detalle trae el glosario de la charla: se escribe, se carga de un `.csv` o `.txt` y se completa con «Sugerir términos», que es una heurística local sobre el título y el resumen (no usa IA; con Gemma en Workers AI queda para después). **Pendiente:** arranque y parada por agenda (`sesion-en-vivo`) y la transcripción de las charlas terminadas (hace falta la migración de transcripciones).

**Estructura:** `componentes/` · `hooks/` · `api.ts` (si llama a la API) · `index.ts` (lo único que importan las rutas).

**Maqueta de referencia:** ver la tabla de `navegador/rutas/README.md`.
