# metricas ♻

**Qué hace:** Mide calidad y tiempos: WER (palabras mal), términos del glosario bien escritos, retraso de una palabra y ritmo ("¿llega en vivo?").

**Qué NO hace:** Mostrar resultados ni guardarlos.

## API pública (solo desde `index.ts`)

- `calcularWer(referencia, hipotesis): number` — sin mayúsculas, tildes ni puntuación (como mide Whisper). Puede pasar de 1 con una alucinación larga; con la referencia vacía es 0 o 1.
- `contarTerminos(referencia, hipotesis, terminos): { bien, total }` — `total`: apariciones de los términos en la referencia; `bien`: cuántas de esas quedaron en la hipótesis. Recibe los términos como texto, así no depende del glosario.
- `llegaEnVivo(duraciones, largos): boolean` — percentil 80 de `duración / largo real` menor que 1. Sin mediciones, `false`; si faltan largos, error.

## Dependencias

- **Puede importar:** `compartido/distancia-edicion` (WER).
- **Lo usan:** `evaluar-equipo`, `monitoreo`, revisión de calidad, comparación de la landing.

## Archivos

- `texto.ts` (normalización para medir) · `wer.ts` · `terminos.ts` · `tiempos.ts` · `index.ts`

## Pruebas

Casos con puntuación, mayúsculas y números.

## Referencia

Documento de decisiones → "Prioridad de latencia" y "Comparación con charlas reales".
