# sesion-en-vivo

**Qué cubre:** Controla una sala en vivo: la charla que se está transcribiendo, la fuente de audio (entrada del equipo, pestaña, link a un video o audio, o un archivo), los idiomas, el glosario, dónde se transcribe (esta computadora o la nube), la barra de velocidad, el traductor y "Evaluar esta computadora"; iniciar, detener y probar sin publicar; la transcripción con sus traducciones, que se puede corregir a mano; las mediciones y "Borrar los modelos guardados". Arma las piezas de `modulos/` y se las pasa a `flujo-subtitulos`.

**Qué NO hace:** Implementar la transcripción o la traducción: usa `modulos/`. Guardar la transcripción: la publica en la sala (`cliente-sala`) y la sala la guarda por charla.

**API:** `useSesionEnVivo()` (estado, líneas, mediciones, avisos, variante de Whisper, idiomas; `iniciar`, `detener`, `corregirLinea`, `agregarAlGlosario`, `limpiar`) y `SesionEnVivo`.

**Estructura:** `motor/preparar-modelos.ts` (Whisper y Bergamot se cargan una vez por pestaña) · `motor/armar-sesion.ts` (captura + cortador + flujo) · `hooks/useSesionEnVivo.ts` · `componentes/` (`SesionEnVivo`, `ControlSesion`, `Transcripcion`, `Mediciones`) · `index.ts`.

**Maqueta de referencia:** `sesion-operador.html`.
