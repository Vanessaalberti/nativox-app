# audio-wav ♻

**Qué hace:** Revisa que un audio sea WAV PCM de 16 bits, mono, a 16 kHz y mide su duración sin decodificarlo, para rechazar lo que pase del límite antes de gastar un pedido de IA.

**Qué NO hace:** Decodificar, convertir ni transcribir.

## API pública (solo desde `index.ts`)

- `validarWav(datos, maximoSegundos): Resultado<{ segundos }>`

## Dependencias

- **Puede importar:** `compartido/contratos` (`Resultado`).
- **Lo usa:** `api/transcribir`.
