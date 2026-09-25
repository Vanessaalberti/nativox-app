# captura-audio ♻

**Qué hace:** Abre una fuente de audio (entrada del equipo o micrófono, el audio de una pestaña, un link a un video o audio, o un archivo) y entrega bloques PCM mono a 16 kHz de 100 ms. Avisa si la pista se corta. El archivo se entrega en tiempo real y sin sonar, como si alguien lo estuviera diciendo.

**Qué NO hace:** Cortar ni transcribir. No reproduce el audio por los parlantes. Por defecto va sin cancelación de eco, supresión de ruido ni control de volumen (con la señal limpia de una consola, esos filtros le quitan a Whisper partes de la voz); con `conFiltrosDeVoz: true` se prenden, para el micrófono de una notebook o un auricular (lo usa la portada de la landing).

## API pública (solo desde `index.ts`)

- `listarFuentes(): Promise<FuenteAudio[]>` — entradas de audio (sin permiso concedido, el navegador no dice sus nombres).
- `abrirEntrada(idDispositivo | null, { alRecibir, alTerminar }): Promise<Resultado<Captura>>` — sin permiso o sin dispositivo es un resultado con el motivo y qué hacer.
- `abrirArchivo(archivo, { alRecibir, alTerminar }): Promise<Resultado<Captura>>`
- `abrirPestana(opciones)` y `abrirEnlace(direccion, opciones)`: la segunda devuelve además el `video` que suena sin parlantes.
- `Captura`: `detener()`. `FRECUENCIA` (16 000).

## Dependencias

- **Puede importar:** `compartido/contratos` (`Resultado`).
- **Lo usan:** `sesion-en-vivo`; `autorreparacion` (vigila `alTerminar`, paso 8).

## Archivos

- `tipos.ts` · `procesador.ts` (AudioWorklet, cargado como Blob) · `entrada-equipo.ts` · `entrada-archivo.ts` · `tiempo-real.ts` · `index.ts`
- `entrada-pestana.ts` (audio de otra pestaña) · `entrada-enlace.ts` (un video por su link) · `nodo-de-captura.ts` (el procesador compartido).

## Pruebas

Entrega en tiempo real con un reloj de mentira: nada antes de tiempo, un bloque cada 100 ms, se pone al día si el temporizador llega tarde, el resto al final.

## Referencia

Documento de decisiones → "Captura de audio".
