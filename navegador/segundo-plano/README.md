# segundo-plano — puntos de entrada de los Web Workers

- `modelos.worker.ts` — SharedWorker: aloja Whisper (Transformers.js + WebGPU) y los traductores, una sola vez por equipo (ver `modulos/modelos-compartidos`).
- `bergamot.worker.ts` — si Bergamot necesita su propio worker.

Solo conectan mensajes con los módulos; la lógica vive en `modulos/`.
