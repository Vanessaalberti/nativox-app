# distancia-edicion ♻

**Qué hace:** calcula la distancia de Levenshtein entre dos secuencias (letras o palabras).

**Qué NO hace:** normalizar texto (mayúsculas, tildes, puntuación): eso lo decide quien la usa.

## API pública (solo desde `index.ts`)

- `distanciaEdicion(a, b): number` — cantidad mínima de inserciones, borrados o reemplazos.

## Dependencias

- **Puede importar:** nada.
- **Lo usan:** `compartido/glosario` (parecido de 1–2 letras) y `compartido/metricas` (WER). Se separó al segundo uso real.

## Pruebas

Secuencias iguales, vacías, letras ("conex" → "konex") y palabras ("ask not what" → "ask what").
