# contratos

**Qué hace:** define y valida todo lo que cruza entre el navegador y el servidor: pedidos y respuestas de la API, mensajes del WebSocket de la sala (subtítulos, señales, comandos) y datos de la agenda.

**Qué NO hace:** lógica de negocio ni llamadas de red.

## API pública (solo desde `index.ts`)

- `validar(esquema, dato): Resultado<T>` — `{ ok: true, valor }` o `{ ok: false, motivo }` (dice qué campo está mal). Un dato inválido es un resultado esperable, no una excepción.
- `IDIOMAS`, `esquemaIdioma`, `Idioma` — `es`, `en`, `pt`.
- `esquemaMensajeSala` (`MensajeSala`) — mensajes del WebSocket de la sala, distinguidos por `tipo`:
  - `linea` (`esquemaLinea`): `{ id, original, traducciones: { es?, en?, pt? }, provisoria, inicio, fin }` (segundos desde el comienzo de la sesión; `fin ≥ inicio`). La misma línea se actualiza por `id`, nunca se duplica. El espectador elige qué idioma mostrar.
  - `senal` (`esquemaSenal`): `{ estado: "en-vivo" | "detenida" | "reparando", nivelAudio (0–1), latenciaMs }`.
  - `comando` (`esquemaComando`): `{ id, accion: "reiniciar" | "pasar-a-la-nube" | "silenciar-avisos" }`.
  - `agenda` (`esquemaAgenda`): `{ momento: "empieza" | "termina", charlaId, titulo, idioma }`.
- `esquemaSalida` (`Salida`) — salida de producción: `{ numero, salaAlAire (o null), estilo }`, con `estilo` (`esquemaEstiloSalida`): `{ idioma, lineas (1–3), posicion: "abajo" | "arriba", mostrarOriginal, tamanoLetra }` (píxeles sobre 1920 de ancho).
- `esquemaRespuestaError` (`RespuestaError`) — formato común de error de la API: `{ ok: false, error: { codigo, mensaje } }`.

## Dependencias

- **Puede importar:** `valibot`.
- **Lo usan:** el navegador y el servidor, en los dos lados de cada mensaje.

## Archivos

- `idiomas.ts` · `validar.ts` · `socket-sala.ts` · `socket-produccion.ts` · `api/errores.ts` · `index.ts`
- `api/acceso.ts` · `api/evento.ts` · `api/salas.ts` · `api/charlas.ts` · `api/operadores.ts` · `api/ajustes.ts` · `api/audiencia.ts` · `api/produccion.ts` · `api/transcribir.ts`

## Reglas

- Cada esquema se valida en **los dos lados** (quien envía y quien recibe).
- Un cambio incompatible en un mensaje lleva versión (`v`) y convive con la anterior hasta que las dos puntas se actualizan.
