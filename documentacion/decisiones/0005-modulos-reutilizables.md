# 0005 — Módulos reutilizables dentro del repositorio

**Estado:** aceptada (24/09/2026)

**Contexto:** Transcripción, traducción, glosario y exportar subtítulos sirven en otros proyectos, pero hoy hay un solo consumidor estable y el botón de deploy no soporta monorepos.

**Decisión:** Módulos ♻ en `navegador/modulos`, `compartido/` y `servidor/modulos`, sin imports de fuera de su carpeta (lo hace cumplir el lint). La landing usa una copia sincronizada.

**Alternativas descartadas:** Paquetes npm publicados (costo de versionado sin un segundo consumidor); monorepo.

**Consecuencias:** Extraer un módulo es copiar la carpeta.

Detalle y mediciones: `Vibeathon Nerdearla 2026 — Transcripción en vivo.md`.
