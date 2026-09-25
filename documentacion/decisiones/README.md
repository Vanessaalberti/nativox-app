# Decisiones de arquitectura

Una decisión por archivo: contexto, decisión, alternativas descartadas y consecuencias. Una decisión no se edita: si cambia, se escribe otra que la reemplaza.

| Número | Decisión |
| --- | --- |
| 0001 | Local primero: Whisper turbo + Bergamot en el navegador; la nube es opcional |
| 0002 | Un solo Worker de Cloudflare (app + API + Durable Objects + D1) con deploy de un clic |
| 0003 | Sin API keys: Workers AI por binding |
| 0004 | Avisos por webhook de Discord, sin bot |
| 0005 | Módulos reutilizables dentro del repositorio, con límites de import, en vez de paquetes npm |
| 0006 | Traducción: Bergamot (rápida) y TranslateGemma 4B (calidad) |
| 0007 | Todo en español |
