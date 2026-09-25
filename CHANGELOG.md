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
