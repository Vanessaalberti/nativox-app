# avisos ♻

**Qué hace:** Decide cuándo y qué avisar de una sala y arma los mensajes que llegan al canal (🟢 🟡 🔴 ✓): si la sala se calló (más de 30 s sin señal) o volvió, cuándo empieza y termina cada charla y qué acción se hizo desde un link. Los links de acción de un solo uso vencen a los 15 minutos.

**Hoy:** decisión y formato; el envío por webhook está en `plataforma/avisos-por-webhook`.

**Qué NO hace:** Mandar el mensaje (eso lo hace `plataforma/avisos-por-webhook`, que recibe la dirección del webhook) ni guardar nada. Discord, Slack y Google Chat reciben el mismo texto: los botones de Discord necesitan un bot y no se usan.

## API pública (solo desde `index.ts`)

- `evaluarSenal({ senalEn, ahora, enAlerta, hubo })` → `avisar-caida` · `avisar-recuperacion` · `nada`
- `debeAvisar(tipo, ajustes.avisar)` · `estaSilenciado(hasta, ahora)` · `SEGUNDOS_SIN_SENAL` · `MINUTOS_DE_SILENCIO`
- `avisoSinSenal` · `avisoRecuperada` · `avisoDeCharla` · `avisoDeAccion`

## Dependencias

- **Puede importar:** `compartido/contratos`.
- **Lo usan:** `objetos-durables/sala`, `api/acciones`.

## Pruebas

Un aviso de caída una sola vez por corte, el de recuperación al volver, nada de una sala que nunca arrancó, qué se avisa según los ajustes y el texto de cada mensaje.
