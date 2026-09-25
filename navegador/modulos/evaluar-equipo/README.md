# evaluar-equipo ♻

**Qué hace:** "Evaluar esta computadora" **sin descargar nada y sin audio**: detecta WebGPU, f16, la placa, la RAM, los núcleos y el buffer más grande que el navegador deja pedir; mide la potencia de la placa con un benchmark de WebGPU (multiplicación de matrices, ~60 ms); estima cuánto tardaría una pasada de Whisper y recomienda la versión de Whisper (sin comprimir con f16, comprimida sin f16), el nivel de la barra de velocidad, si hace falta la nube y si el equipo tendría margen para TranslateGemma.

| Pasada estimada de Whisper | Nivel | Qué hace |
| --- | --- | --- |
| menos de 0,6 s | 4 · Máximo | texto provisorio lo más seguido que dé la placa (~0,4 s) |
| menos de 1,2 s | 3 · Rápido | texto provisorio cada ~1 s |
| menos de 2,5 s | 2 · Equilibrado | texto provisorio cada ~2 s |
| más | 1 · Ahorro | solo frases completas (corte en pausas) |

Si la pasada estimada pasa de 6 s, ni cortando por frases llega en vivo: recomienda la nube. Sin WebGPU, también. Con 4 GB de RAM o menos, o un buffer máximo de menos de 2 GB, avisa y descarta TranslateGemma.

**Es una estimación:** la pasada se calcula en proporción a la potencia medida, calibrada con una sola placa de referencia (AMD GCN 4, sin f16: 1030 GFLOPS medidos y 2,8 s de pasada real de Whisper). Es conservadora con las placas con f16 (corren Whisper sin comprimir y rinden mejor) y no mide la memoria de video. La pasada real se ve al probar.

**Qué NO hace:** Aplicar la recomendación (la devuelve y la interfaz la muestra), cargar modelos ni grabar audio. Tampoco elige el traductor: recomienda Bergamot y solo dice si el equipo tendría margen para TranslateGemma (`margenParaGemma`); usarlo lo decide quien usa el módulo.

## API pública (solo desde `index.ts`)

- `evaluarEquipo(alAvanzar): Promise<Resultado<Evaluacion>>` — todo junto: detecta, mide, estima y recomienda; avisa en qué etapa va. Es lo que usan la landing y el asistente de crear evento.
- `detectarEquipo(): Promise<Equipo>` — `{ webgpu, f16, placa, memoriaGb, nucleos, bufferMaximoMb }`. Sin WebGPU no falla: lo dice.
- `medirRendimiento(): Promise<Resultado<{ gflops }>>` — el benchmark. Corta a los 8 s si la placa no contesta (nunca deja la pestaña esperando).
- `estimarPasada(gflops): number` — milisegundos estimados de una pasada de Whisper.
- `recomendar(equipo, medidas | null): Recomendacion` — `{ version, nivel, traductor, margenParaGemma, usarNube, motivos }`. Los `motivos` son datos (`{ codigo, ... }`), no texto: cada interfaz los escribe en su idioma.
- `NIVELES`, `pasadaProvisoriaDelNivel(nivel)` — lo que cada nivel le pide a `flujo-subtitulos` (`pasadaProvisoriaCadaMs`).

## Dependencias

- **Puede importar:** `compartido/contratos`.
- **Lo usan:** landing ("Probar"), `crear-evento` (paso 3) y, después, `sesion-en-vivo`.

## Archivos

- `placa.ts` · `rendimiento.ts` · `recomendacion.ts` · `niveles.ts` · `index.ts`

## Pruebas

Los umbrales de cada nivel en sus bordes, la estimación de la pasada, placa sin f16 (2,8 s → nivel 1), placa buena, sin WebGPU, nube, margen para TranslateGemma y sus límites de memoria. El benchmark corre solo en un navegador con WebGPU (medido en el navegador: 1020 a 1076 GFLOPS en 5 corridas de la placa de referencia).

## Referencia

Documento de decisiones → "Decisión 24/09: local primero, con \"Evaluar mi computadora\" y barra de velocidad".
