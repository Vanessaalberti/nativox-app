# medidor-consumo ♻

**Qué hace:** Estima el consumo de Workers AI por minutos procesados (46,63 neurons por minuto de audio, ~120% por el contexto) y aplica topes y avisos al 80% y al 95%.

**Qué NO hace:** Leer la factura real de Cloudflare.

## API pública (solo desde `index.ts`)

- `registrarConsumo(db, { salaId, segundos })`
- `revisarTopes(db): { porcentaje, superado }`

## Dependencias

- **Puede importar:** `compartido/contratos`.
- **Lo usan:** `api/ia`, `api/consumo`.

## Archivos previstos

- `estimacion.ts` · `topes.ts` · `index.ts`

## Pruebas

Cálculo de neurons; tope que corta; cambio de día.

## Referencia

Documento de decisiones → "Consumo, topes y avisos".
