# evaluar-equipo ♻

**Qué hace:** "Evaluar esta computadora": detecta WebGPU, f16 y la placa; mide una pasada de Whisper y la traducción sobre un audio de muestra (descarta la primera pasada, que calienta la placa, y toma la mediana de las siguientes); y recomienda la versión de Whisper (sin comprimir con f16, comprimida sin f16), el nivel de la barra de velocidad, si hace falta la nube y si el equipo tendría margen para TranslateGemma.

| Pasada de Whisper | Nivel | Qué hace |
| --- | --- | --- |
| menos de 0,6 s | 4 · Máximo | texto provisorio lo más seguido que dé la placa (~0,4 s) |
| menos de 1,2 s | 3 · Rápido | texto provisorio cada ~1 s |
| menos de 2,5 s | 2 · Equilibrado | texto provisorio cada ~2 s |
| más | 1 · Ahorro | solo frases completas (corte en pausas) |

Si una pasada tarda más de 6 s, ni cortando por frases llega en vivo: recomienda la nube. Sin WebGPU, también.

**Qué NO hace:** Aplicar la recomendación (la devuelve y la interfaz la muestra), cargar modelos ni descargar nada: recibe por parámetro las piezas para transcribir y traducir la muestra. Tampoco elige TranslateGemma: todavía no está integrado, así que solo dice si el equipo lo aguantaría (`margenParaGemma`).

## API pública (solo desde `index.ts`)

- `detectarEquipo(): Promise<Equipo>` — `{ webgpu, f16, placa, memoriaGb, nucleos }`. Sin WebGPU no falla: lo dice.
- `medirEquipo(piezas, idiomasDestino, alPaso?): Promise<Resultado<Medidas>>` — `piezas`: `transcribirMuestra()` y `traducirMuestra(a)`, cada una devuelve `{ ms }`. `Medidas`: `{ pasadaMs, traduccionMs }`.
- `recomendar(equipo, medidas | null): Recomendacion` — `{ version, nivel, traductor, margenParaGemma, usarNube, motivos }`. Los `motivos` son datos (`{ codigo, ... }`), no texto: cada interfaz los escribe en su idioma.
- `NIVELES`, `pasadaProvisoriaDelNivel(nivel)` — lo que cada nivel le pide a `flujo-subtitulos` (`pasadaProvisoriaCadaMs`).

## Dependencias

- **Puede importar:** `compartido/contratos`. Recibe lo demás (los modelos, el traductor) por parámetro.
- **Lo usan:** landing ("Probar"); después `crear-evento` y `sesion-en-vivo`.

## Archivos

- `placa.ts` · `medicion.ts` · `recomendacion.ts` · `niveles.ts` · `index.ts`

## Pruebas

Los umbrales de cada nivel en sus bordes, placa sin f16 (2,5 s → nivel 1), placa buena, sin WebGPU, nube, margen para TranslateGemma, y la medición (descarta el calentamiento, mediana, corta si Whisper falla).

## Referencia

Documento de decisiones → "Decisión 24/09: local primero, con \"Evaluar mi computadora\" y barra de velocidad".
