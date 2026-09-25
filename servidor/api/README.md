# api — un archivo por recurso

Cada archivo valida el pedido con `compartido/contratos`, autoriza (rol y sala), llama a D1, al Durable Object o a los módulos y responde con el contrato.

| Archivo previsto | Qué atiende |
| --- | --- |
| `salud.ts` | `/api/salud`: si el Worker responde (deploy y monitoreo). **Ya existe** |
| `acceso.ts` | `POST /api/acceso/cuenta` (crea al administrador, una sola vez), `/ingresar`, `/recuperar` (con el código de un solo uso), `/operador` (entra con el código de invitación) y `/salir`. **Ya existe** |
| `evento.ts` | `GET /api/estado` (qué falta y quién pregunta, sin datos sensibles), `POST /api/evento` (una sola vez, solo el administrador) y `GET /api/evento`. **Ya existe** (falta eliminar el evento) |
| `salas.ts` | `GET/POST /api/salas` (crear una o varias, todas o ninguna) y `GET/PUT/DELETE /api/salas/:id`. **Ya existe** |
| `operadores.ts` | `GET/POST /api/operadores` (invitar, con el código una sola vez), `PUT/DELETE /api/operadores/:id` y `POST /api/operadores/:id/codigo` (código nuevo). El ingreso por código es `POST /api/acceso/operador`. **Ya existe** |
| `agenda.ts` | `GET/POST /api/salas/:id/charlas` y `PUT/DELETE /api/charlas/:id` (con el glosario de cada charla; sin dos charlas a la vez en una sala). **Ya existe** (falta arranque y parada por agenda) |
| `transcripciones.ts` | Transcripción de cada charla (`/api/charlas/:id/transcripcion`) y el registro de qué estuvo al aire. **Ya existe** |
| `ajustes.ts` | Ajustes, webhook (guardar y probar; solo Discord, Slack o Google Chat), y en `acceso.ts`/`evento.ts` la contraseña, el código de recuperación y eliminar el evento. **Ya existe** (falta `avisos` automáticos) |
| `produccion.ts` | Salidas de producción (`/api/salidas`, solo administrador), el estilo de cada sala (`PUT /api/salas/:id/estilo`) y las páginas públicas de vMix/OBS (`/api/publico/...`). **Ya existe** |
| `acciones.ts` | Los links de un solo uso de los avisos (`/api/publico/acciones/:token`: ver y confirmar). **Ya existe** |
| `ia.ts` | Workers AI: transcripción (Opus) y términos sugeridos con Gemma |
| `consumo.ts` | Consumo estimado y topes |
