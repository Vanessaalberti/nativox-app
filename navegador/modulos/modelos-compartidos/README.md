# modelos-compartidos ♻

**Qué hace:** Carga Whisper y los traductores **una vez** en un SharedWorker y los comparte entre todas las salas del equipo, con una cola por turnos. Sabe si un modelo está descargado ("Descargado ✓" solo si están todos los archivos pesados) y lo activa desde el disco sin internet.

**Qué NO hace:** Decidir qué modelo usar (eso es `evaluar-equipo`).

## API pública (solo desde `index.ts`)

- `conectarModelos(): Modelos`
- `estaDescargado(modelo)` · `descargar(modelo, alAvanzar)` · `ejecutar(modelo, entrada)`

## Dependencias

- **Puede importar:** nada (habla con `navegador/segundo-plano/modelos.worker.ts`).
- **Lo usan:** `transcripcion`, `traduccion`, `evaluar-equipo`.

## Archivos previstos

- `cliente.ts` · `cache.ts` · `turnos.ts` · `index.ts`

## Pruebas

Dos salas comparten un modelo; cola justa; una caché incompleta no cuenta como descargada.

## Referencia

Documento de decisiones → "Varias salas en una computadora" (SharedWorker con WebGPU, Chrome 124 o posterior).
