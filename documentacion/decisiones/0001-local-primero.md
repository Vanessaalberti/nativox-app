# 0001 — Local primero

**Estado:** aceptada (24/09/2026)

**Contexto:** La latencia la manda cómo se corta el audio, no dónde corre Whisper. Correr en la computadora de la sala es gratis, no tiene límite de pedidos y funciona sin internet.

**Decisión:** Whisper large-v3 turbo (Transformers.js + WebGPU) y Bergamot en el navegador, con "Evaluar esta computadora" y barra de velocidad. Workers AI queda como opción apagada por defecto.

**Alternativas descartadas:** Todo en la nube (costo por sala y dependencia de internet); Groq (más caro, límite de salas); Gemini Transcribe (23–54 s por toma).

**Consecuencias:** Depende del equipo de cada sala: hay que medirlo antes del evento.

Detalle y mediciones: `Vibeathon Nerdearla 2026 — Transcripción en vivo.md`.
