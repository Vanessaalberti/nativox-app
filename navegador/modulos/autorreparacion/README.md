# autorreparacion ♻

**Qué hace:** Vigila señales de salud (silencio en plena charla, audio saturado, audio sin texto, frase repetida en bucle, latencia creciente, placa perdida, pista terminada, WebSocket cerrado) y repara en tres pasos: reconectar → reiniciar el modelo desde el disco → recargar y retomar. Informa cada paso para el aviso.

**Qué NO hace:** Mandar avisos (eso lo hace el servidor) ni saber de Discord.

## API pública (solo desde `index.ts`)

- `crearSupervisor({ controles, reparaciones, alInformar })`
- informes: `{ problema, paso, recuperado, duracionMs }`

## Dependencias

- **Puede importar:** nada. Las reparaciones entran por parámetro.
- **Lo usan:** `sesion-en-vivo`.

## Archivos previstos

- `controles.ts` · `escalera.ts` · `supervisor.ts` · `index.ts`

## Pruebas

Cada falla sube por los pasos en orden; si un paso arregla, no sigue; sin bucles de reinicio (espera creciente).

## Referencia

Documento de decisiones → "Operación desatendida".
