# cortador-audio ♻

**Qué hace:** Corta el audio en fragmentos en las pausas (primera pausa de 0,3 s o más pasado el mínimo; si no, al llegar al máximo de 8 s, la pausa de 0,12 s o más más larga; si no, el máximo), con umbral relativo al ruido (percentil 15 × 2,5, con un tope de la mitad del percentil 90 para cuando la toma arranca hablando). Recorta silencios en los bordes (margen de 0,25 s), acorta los silencios internos de más de 0,5 s a 0,2 s, descarta los fragmentos sin voz y pega 1,5 s del fragmento anterior como contexto.

**Qué NO hace:** Transcribir. No decide el mínimo: lo recibe y se lo pueden cambiar (`flujo-subtitulos` lo adapta a lo que tarda cada pasada).

## API pública (solo desde `index.ts`)

- `crearCortador({ minimoSegundos, maximoSegundos?, contextoSegundos?, frecuencia? }): Cortador`
  - `agregar(bloque)` → los fragmentos que se cerraron: `{ numero, audio, inicio, fin, segundosDeContexto }` (`inicio` y `fin`, en segundos desde que empezó la captura, son de la parte nueva).
  - `terminar()` → lo que quedaba, como último fragmento.
  - `cambiarMinimo(segundos)` → vale desde el corte siguiente.
  - `pendiente()` → lo que se viene diciendo desde el último corte (para el texto provisorio).

## Dependencias

- **Puede importar:** nada.
- **Lo usan:** `sesion-en-vivo` (lo pasa a `flujo-subtitulos`).

## Archivos

- `energia.ts` (tramas de 10 ms y umbral) · `pausas.ts` · `silencios.ts` · `cortador.ts` · `index.ts`

## Pruebas

Audio sintético determinista: tres frases se cortan en sus pausas y no entre palabras (0,15 s); contexto de 1,5 s salvo en el primero; un fragmento sin voz no sale; corte forzado en la pausa corta más larga y en 8 s; silencios internos acortados; mínimo cambiado.

## Referencia

Documento de decisiones → "Cómo se corta y se manda el audio".
