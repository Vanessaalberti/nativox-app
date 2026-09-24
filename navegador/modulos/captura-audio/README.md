# captura-audio ♻

**Qué hace:** Abre una fuente de audio (entrada del equipo, micrófono, archivo, pestaña) y entrega bloques PCM mono a 16 kHz. Avisa si la pista se corta o cambia el dispositivo.

**Qué NO hace:** Cortar ni transcribir. No reproduce el audio por los parlantes (en la prueba con archivo tampoco).

## API pública (solo desde `index.ts`)

- `listarFuentes(): Promise<FuenteAudio[]>`
- `abrirFuente(fuente, alRecibir): Promise<Captura>` (con `detener()` y `alTerminar`)
- `abrirArchivo(archivo, { tiempoReal }): Captura` (simula el tiempo real)

## Dependencias

- **Puede importar:** nada.
- **Lo usan:** `sesion-en-vivo`, `autorreparacion` (vigila `alTerminar`).

## Archivos previstos

- `fuentes.ts` · `entrada-equipo.ts` · `entrada-archivo.ts` · `entrada-pestana.ts` · `remuestrear.ts` · `index.ts`

## Pruebas

Remuestreo a 16 kHz; archivo en tiempo real sin sonido; dispositivo desconectado.

## Referencia

Documento de decisiones → "Captura de audio".
