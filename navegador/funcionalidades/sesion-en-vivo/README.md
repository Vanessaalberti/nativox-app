# sesion-en-vivo

**Qué cubre:** Controla una sala en vivo: fuente de audio (entrada del equipo o micrófono, o un archivo de prueba que suena en tiempo real sin parlantes), idioma original e idiomas de traducción, glosario, texto en vivo, iniciar y detener, la transcripción con sus traducciones, las mediciones y "Borrar los modelos guardados" (frase dicha → confirmada y → traducida, pasada de Whisper, traducción). Arma las piezas de `modulos/` y se las pasa a `flujo-subtitulos`.

**Qué NO hace:** Implementar la transcripción o la traducción: usa `modulos/`. Todavía no: barra de velocidad y "Evaluar esta computadora" (paso 11), `cliente-sala` (paso 5), `autorreparacion` (paso 8).

**API:** `useSesionEnVivo()` (estado, líneas, mediciones, avisos, variante de Whisper, idiomas; `iniciar`, `detener`, `limpiar`) y `SesionEnVivo({ nombreSala, sesion, alAbrirEscenario })`.

**Estructura:** `motor/preparar-modelos.ts` (Whisper y Bergamot se cargan una vez por pestaña) · `motor/armar-sesion.ts` (captura + cortador + flujo) · `hooks/useSesionEnVivo.ts` · `componentes/` (`SesionEnVivo`, `ControlSesion`, `Transcripcion`, `Mediciones`) · `index.ts`.

**Maqueta de referencia:** `sesion-operador.html`.
