# api — un archivo por recurso

Cada archivo valida el pedido con `compartido/contratos`, autoriza (rol y sala), llama a D1, al Durable Object o a los módulos y responde con el contrato.

| Archivo previsto | Qué atiende |
| --- | --- |
| `salud.ts` | `/api/salud`: si el Worker responde (despliegue y monitoreo). **Ya existe** |
| `acceso.ts` | Crear cuenta, ingresar, recuperar con código, canjear invitaciones |
| `evento.ts` | Datos del evento, eliminar evento |
| `salas.ts` | Salas y sus idiomas |
| `operadores.ts` | Operadores e invitaciones |
| `agenda.ts` | Charlas, glosario por charla, arranque y parada por agenda |
| `transcripciones.ts` | Transcripción de cada charla y exportar |
| `avisos.ts` | Guardar y probar el webhook, qué avisar |
| `produccion.ts` | Salidas de producción: crear, estilo y qué sala está al aire (solo administrador) |
| `acciones.ts` | Acciones a distancia (monitoreo) y canje de links de un solo uso |
| `ia.ts` | Workers AI: transcripción (Opus) y términos sugeridos con Gemma |
| `consumo.ts` | Consumo estimado y topes |
