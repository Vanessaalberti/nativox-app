# segundo-plano — puntos de entrada de los Web Workers

- `modelos.worker.ts` — Web Worker que aloja Whisper (Transformers.js + WebGPU); solo conecta los mensajes con `modulos/modelos-compartidos` (`en-worker.ts`). En el paso 11 pasa a SharedWorker (un modelo para varias salas del equipo).

Bergamot no necesita uno propio: la biblioteca crea su worker.

Solo conectan mensajes con los módulos; la lógica vive en `modulos/`.
