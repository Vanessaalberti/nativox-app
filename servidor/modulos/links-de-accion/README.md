# links-de-accion ♻

**Qué hace:** Crea y canjea links de acción **de un solo uso**: vencen a los 15 minutos, sirven para una acción en una sala y registran quién la hizo.

**Qué NO hace:** Ejecutar la acción (devuelve qué acción y qué sala; la ejecuta `api/acciones`).

## API pública (solo desde `index.ts`)

- `crearLinkDeAccion({ accion, salaId, vigenciaSegundos }): Promise<string>`
- `canjearLinkDeAccion(token): Promise<Resultado<{ accion, salaId }>>`

## Dependencias

- **Puede importar:** `compartido/contratos`.
- **Lo usan:** `api/acciones`, `avisos` (para armar los botones).

## Archivos previstos

- `tokens.ts` · `almacen.ts` · `index.ts`

## Pruebas

Vencido, reusado, adulterado y de otra sala: todos fallan.

## Referencia

Documento de decisiones → "Avisos: webhook de Discord".
