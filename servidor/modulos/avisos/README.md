# avisos ♻

**Qué hace:** Envía avisos a canales: webhook de Discord (con botones de link mediante `with_components`), Slack y Google Chat. Da formato a los mensajes (🟢 🟡 🔴 ✓ 📊), agrupa los avisos repetidos y respeta los límites de envío.

**Qué NO hace:** Decidir cuándo avisar (eso lo hace quien lo llama). No guarda el webhook: lo recibe.

## API pública (solo desde `index.ts`)

- `enviarAviso(canal, aviso): Promise<Resultado>`
- `formatearAviso(aviso, idioma): Mensaje`

## Dependencias

- **Puede importar:** `compartido/contratos`.
- **Lo usan:** `objetos-durables/sala`, `api/avisos`, `api/acciones`.

## Archivos previstos

- `canales/discord.ts` · `canales/slack.ts` · `canales/google-chat.ts` · `formato.ts` · `index.ts`

## Pruebas

Formato de cada canal; botones de link; reintento ante 429 con espera; el secreto nunca aparece en los logs.

## Referencia

Documento de decisiones → "Avisos: webhook de Discord".
