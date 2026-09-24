# Registro de cambios

Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Nativox se despliega de forma continua desde `main`.

## [Sin publicar]

- Estructura inicial del proyecto.
- Esqueleto de la aplicación: React + Vite y un Worker de Cloudflare con D1, los Durable Objects `SALA` y `PRODUCCION` y Workers AI; `/api/salud`; herramientas de calidad (`npm run revisar`) e integración continua.
- Código compartido con pruebas: contratos (valibot) de los mensajes de la sala y de producción; glosario (leer, prompt de Whisper, corrección, protección al traducir); exportar a SRT, VTT y texto con corrimiento; métricas (WER, términos, "llega en vivo").
