# captura-audio ♻

**Qué hace:** Abre una fuente de audio (entrada del equipo o micrófono, o un archivo) y entrega bloques PCM mono a 16 kHz de 100 ms. Avisa si la pista se corta. El archivo se entrega en tiempo real y sin sonar, como si alguien lo estuviera diciendo.

**Qué NO hace:** Cortar ni transcribir. No reproduce el audio por los parlantes. Sin cancelación de eco, supresión de ruido ni control de volumen: son filtros para llamadas y le quitan a Whisper partes de la voz.

## API pública (solo desde `index.ts`)

- `listarFuentes(): Promise<FuenteAudio[]>` — entradas de audio (sin permiso concedido, el navegador no dice sus nombres).
- `abrirEntrada(idDispositivo | null, { alRecibir, alTerminar }): Promise<Resultado<Captura>>` — sin permiso o sin dispositivo es un resultado con el motivo y qué hacer.
- `abrirArchivo(archivo, { alRecibir, alTerminar }): Promise<Resultado<Captura>>`
- `Captura`: `detener()`. `FRECUENCIA` (16 000).

## Dependencias

- **Puede importar:** `compartido/contratos` (`Resultado`).
- **Lo usan:** `sesion-en-vivo`; `autorreparacion` (vigila `alTerminar`, paso 8).

## Archivos

- `tipos.ts` · `procesador.ts` (AudioWorklet, cargado como Blob) · `entrada-equipo.ts` · `entrada-archivo.ts` · `tiempo-real.ts` · `index.ts`
- Previsto: `entrada-pestana.ts` (audio de otra pestaña, como respaldo).

## Pruebas

Entrega en tiempo real con un reloj de mentira: nada antes de tiempo, un bloque cada 100 ms, se pone al día si el temporizador llega tarde, el resto al final.

## Referencia

Documento de decisiones → "Captura de audio".
