# 0002 — Un solo Worker de Cloudflare

**Estado:** aceptada (24/09/2026)

**Contexto:** El organizador tiene que poder desplegar sin pasos manuales. El botón "Deploy to Cloudflare" no despliega varios Workers juntos y necesita la app aislada en su repositorio.

**Decisión:** Un Worker con la app, la API, los Durable Objects y D1; migraciones en el script `deploy`.

**Alternativas descartadas:** Vercel + Supabase (sin WebSockets, costo por mensaje); varios servicios.

**Consecuencias:** Todo vive en la cuenta del organizador; Vanessa no hostea nada del evento.

Detalle y mediciones: `Vibeathon Nerdearla 2026 — Transcripción en vivo.md`.
