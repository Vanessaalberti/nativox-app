# servidor — Cloudflare

Un solo Worker: sirve la app, la API, los Durable Objects y la IA.

| Carpeta | Qué va | ¿♻? |
| --- | --- | --- |
| `entrada/` | `index.ts`: `/api/*` → `api/`, `/ws/sala/:id` → Durable Object, `/accion/:token` → acciones, el resto → la app | No |
| `api/` | Un archivo por recurso; valida con `compartido/contratos` y autoriza por sala | No |
| `objetos-durables/` | `sala/`: el Durable Object de cada sala; `produccion/`: el de las salidas de producción del evento | No |
| `modulos/` | Piezas reutilizables del lado del servidor | Sí |
| `plataforma/` | Tipos de `env` (generados con `wrangler types`), registrador estructurado, errores | No |

Reglas específicas: `documentacion/convenciones.md` → "Servidor (Cloudflare)".
