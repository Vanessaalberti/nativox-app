# cliente-sala ♻

**Qué hace:** Cliente del WebSocket de la sala: publica las líneas (una vez por línea, con todas sus traducciones), recibe líneas (audiencia, vMix/OBS, componente embebible), manda señales y recibe comandos. Se reconecta solo y se pone al día con lo pendiente.

**Qué NO hace:** Mostrar subtítulos.

## API pública (solo desde `index.ts`)

- `conectarSala({ url, rol }): ConexionSala`
- `publicarLinea(linea)` · `alRecibirLinea(cb)` · `enviarSenal(estado)` · `alRecibirComando(cb)`

## Dependencias

- **Puede importar:** `compartido/contratos`.
- **Lo usan:** `sesion-en-vivo`, `audiencia`, `subtitulos-stream`, `componente-embebible`, `monitoreo`.

## Archivos previstos

- `conexion.ts` · `reconexion.ts` · `index.ts`

## Pruebas

Reconexión con espera creciente; los mensajes inválidos se descartan y se registran.

## Referencia

Documento de decisiones → "Reparto a la audiencia".
