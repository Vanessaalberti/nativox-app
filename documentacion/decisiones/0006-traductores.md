# 0006 — Bergamot y TranslateGemma

**Estado:** aceptada (24/09/2026)

**Contexto:** Hace falta traducir al instante en cualquier equipo y con calidad donde el equipo da.

**Decisión:** Bergamot (procesador, ~60 ms) por defecto; TranslateGemma 4B (WebGPU) para calidad en el nivel de velocidad 1. Glosario protegido en los dos.

**Alternativas descartadas:** Opus-MT, EuroLLM, SalamandraTA, NLLB (licencia), traducción en la nube, dos pasadas.

**Consecuencias:** Español ↔ portugués pasa por inglés en Bergamot.

Detalle y mediciones: `Vibeathon Nerdearla 2026 — Transcripción en vivo.md`.
