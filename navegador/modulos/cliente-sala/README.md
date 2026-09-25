# cliente-sala ♻

**Qué hace:** Cliente del WebSocket de la sala (`/api/salas/:id/ws`): publica las líneas (una vez por línea, con todas sus traducciones), recibe líneas (audiencia, vMix/OBS, monitoreo), manda señales y recibe comandos. Se reconecta solo con espera creciente y, al volver, reenvía las líneas que quedaron sin mandar. Los mensajes inválidos se descartan y se registran.

**Qué NO hace:** Mostrar subtítulos ni decidir permisos: el rol lo valida el servidor con la sesión (el de espectador no necesita cuenta).

## API pública (solo desde `index.ts`)

- `conectarSala({ salaId, rol, alMensaje, alCambiarConexion }): ConexionSala`
- `ConexionSala`: `enviar(mensaje)` · `cerrar()`
- `useSala(salaId, rol)` (hook, para quien mira o monitorea): junta las líneas que llegan (con `compartido/lineas`), el estado de la conexión, el estado de la sala (monitoreo) y el último aviso de agenda
- `EstadoDeConexion`: `conectando` · `conectada` · `reconectando` · `reemplazada` (otra computadora tomó la sala: no se reconecta) · `cerrada`

## Dependencias

- **Puede importar:** `compartido/contratos` y `compartido/lineas`.
- **Lo usan:** `sesion-en-vivo`, `audiencia`, `subtitulos-stream`, `produccion`, `monitoreo`.

## Pruebas

Reconexión con espera creciente, reenvío de las líneas pendientes, mensajes inválidos descartados y que "reemplazada" no reconecte.
