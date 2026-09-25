# compartido ♻ — código puro que usan el navegador y el servidor

Sin DOM, sin APIs de Cloudflare, sin estado. Si algo necesita `window` o `env`, no va acá.

| Carpeta | Qué es |
| --- | --- |
| `contratos/` | Tipos y esquemas de validación de todo lo que cruza entre el navegador y el servidor (HTTP y WebSocket) |
| `glosario/` ♻ | Formato del glosario, prompt para Whisper, corrección de la transcripción, protección al traducir |
| `exportar-subtitulos/` ♻ | Segmentos → SRT / VTT / texto, con corrimiento de tiempo |
| `lineas/` ♻ | Armar la lista de líneas de subtítulos (una línea con el mismo id reemplaza a la anterior); la usan la sala y todo el que mira |
| `metricas/` ♻ | WER, términos bien escritos, latencias |
| `distancia-edicion/` ♻ | Distancia de Levenshtein (letras o palabras); la usan `glosario` y `metricas` |

Un módulo de acá no importa a otro salvo que su README lo declare; el lint lo hace cumplir (`dependenciasDeclaradas` en `eslint.config.js`).
