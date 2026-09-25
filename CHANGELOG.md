# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Nativox se despliega de forma continua desde `main`.

## [Sin publicar]

- Estructura inicial del proyecto.
- Esqueleto de la aplicación: React + Vite y un Worker de Cloudflare con D1, los Durable Objects `SALA` y `PRODUCCION` y Workers AI; `/api/salud`; herramientas de calidad (`npm run revisar`) y CI.
- Código compartido con pruebas: contratos (valibot) de los mensajes de la sala y de producción; glosario (leer, prompt de Whisper, corrección, protección al traducir); exportar a SRT, VTT y texto con corrimiento; métricas (WER, términos, "llega en vivo").
- Subtítulos en vivo en la pantalla del escenario, en local: captura (entrada del equipo, micrófono o archivo en tiempo real), cortador en pausas con contexto de audio, Whisper large-v3 turbo en WebGPU con el glosario como prompt, filtro de alucinaciones, texto provisorio (LocalAgreement), traducción con Bergamot con el glosario protegido y el contexto de la línea anterior, corrección del límite entre líneas, pantalla del escenario y mediciones. Los modelos quedan guardados en el navegador (Whisper en OPFS, Bergamot en la Cache API).
- El glosario suma la marca `clave` (códigos opacos): Bergamot la usa porque su modelo inglés→portugués partía las marcas HTML.
- TranslateGemma 4B como traductor de calidad (`crearTranslateGemma`, carga y traducción en `modelos-compartidos`, con la marca de código para el glosario).
- Sin `Referer` (`Referrer-Policy: no-referrer` en `publico/_headers` y en la página): Hugging Face responde 404 sin CORS a los pedidos con `Referer` de un sitio `*.workers.dev`, donde se despliega cada instancia, y la descarga de los modelos fallaba con "Failed to fetch".
- Módulo `evaluar-equipo`: detecta WebGPU, f16, la placa y la memoria, mide la potencia con un benchmark de WebGPU (sin descargar nada ni usar audio) y recomienda versión de Whisper, nivel de velocidad (barra de 4 niveles) y si conviene la nube; con pruebas de las reglas.
- La captura puede abrir el micrófono con los filtros de voz del navegador (`conFiltrosDeVoz`); el filtro de alucinaciones descarta también la salida que repite el prompt; el flujo le pasa a la transcripción cuántos segundos de contexto de audio lleva cada fragmento.
- "Borrar los modelos guardados" en la sesión en vivo (libera lo que el sitio guardó en el navegador).
- El build ya no publica el WebAssembly de ONNX Runtime (26,9 MB, más que el máximo de Cloudflare): Transformers.js lo baja de jsDelivr y queda guardado.
- Crear evento, de punta a punta: pantalla de arranque (según lo que falte en la instancia), asistente de 3 pasos (quién administra y quién opera; cuenta de administrador con "Guardá tu acceso": link de la instancia y código de recuperación de un solo uso; nombre, logo, fechas, estimador de costo de la nube y "Evaluá esta computadora"), ingreso de administrador con recuperación por código, entrada por rol, "sin acceso" y un panel mínimo con los datos del evento.
- Servidor de acceso: contraseñas con PBKDF2 (100.000 iteraciones, el máximo de Workers), sesiones con token al azar en una cookie `HttpOnly` (en la base queda solo su hash), tope de intentos por email y por origen, y una sola cuenta y un solo evento por instancia (el primero que completa el asistente queda como dueño, aunque dos pedidos lleguen a la vez). Migración `0001_evento_y_cuentas.sql`.
- `evaluarEquipo` pasa a `evaluar-equipo` (antes vivía en la landing) y lo usan la landing y el asistente; nuevo módulo `cliente-instancia` con las llamadas a `/api`.
