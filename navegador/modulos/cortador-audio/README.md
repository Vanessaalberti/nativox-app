# cortador-audio ♻

**Qué hace:** Corta el audio en fragmentos en las pausas (primera pausa de 0,3 s o más pasado el mínimo; si no, la mejor de 0,12 s o más; si no, el máximo de 8 s), con umbral relativo al ruido (percentil 15 × 2,5), mínimo adaptativo en local (pasada medida × 1,2 + 0,3 s, entre 1,5 y 4 s) y de 4 s en la nube. Recorta silencios en los bordes, acorta los silencios internos y pega 1,5 s del fragmento anterior como contexto.

**Qué NO hace:** Transcribir. No decide el mínimo: lo recibe (lo calcula `evaluar-equipo` o el motor).

## API pública (solo desde `index.ts`)

- `crearCortador({ minimoSegundos, maximoSegundos, contextoSegundos }): Cortador` (`agregar(bloque)` → fragmentos con `inicio`, `fin`, `desplazamientoContexto`)
- `recortarSilencio(audio)`
- `acortarSilencios(audio)`

## Dependencias

- **Puede importar:** nada.
- **Lo usan:** `flujo-subtitulos`.

## Archivos previstos

- `pausas.ts` · `silencios.ts` · `contexto.ts` · `cortador.ts` · `index.ts`

## Pruebas

El guion de JFK se corta en las tres frases exactas; sin palabras cortadas ("ask ~~not~~ what"); un fragmento sin voz no sale.

## Referencia

Documento de decisiones → "Cómo se corta y se manda el audio".
