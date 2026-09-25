# api — un archivo por recurso

Cada archivo valida el pedido con `compartido/contratos`, autoriza (rol y sala), llama a D1, al Durable Object o a los módulos y responde con el contrato.

| Archivo previsto | Qué atiende |
| --- | --- |
| `salud.ts` | `/api/salud`: si el Worker responde (deploy y monitoreo). **Ya existe** |
| `acceso.ts` | `POST /api/acceso/cuenta` (crea al administrador, una sola vez), `/ingresar`, `/recuperar` (con el código de un solo uso), `/operador` (invitaciones: todavía rechaza todo hasta la migración 0002) y `/salir`. **Ya existe** |
| `evento.ts` | `GET /api/estado` (qué falta y quién pregunta, sin datos sensibles), `POST /api/evento` (una sola vez, solo el administrador) y `GET /api/evento`. **Ya existe** (falta eliminar el evento) |
| `salas.ts` | Salas y sus idiomas |
| `operadores.ts` | Operadores e invitaciones |
| `agenda.ts` | Charlas, glosario por charla, arranque y parada por agenda |
| `transcripciones.ts` | Transcripción de cada charla y exportar |
| `avisos.ts` | Guardar y probar el webhook, qué avisar |
| `produccion.ts` | Salidas de producción: crear, estilo y qué sala está al aire (solo administrador) |
| `acciones.ts` | Acciones a distancia (monitoreo) y canje de links de un solo uso |
| `ia.ts` | Workers AI: transcripción (Opus) y términos sugeridos con Gemma |
| `consumo.ts` | Consumo estimado y topes |
