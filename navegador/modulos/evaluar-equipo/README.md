# evaluar-equipo ♻

**Qué hace:** "Evaluar esta computadora": detecta WebGPU, f16 y la placa; descarga los modelos; pasa un audio de muestra; mide la pasada de Whisper y la traducción; recomienda la versión de Whisper (fp16 solo con f16), el nivel de velocidad (menos de 0,6 s → 4; de 1,2 s → 3; de 2,5 s → 2; si no, 1), el traductor, si hace falta la nube y cuántas salas puede llevar.

**Qué NO hace:** Aplicar la recomendación: la devuelve y la interfaz la muestra.

## API pública (solo desde `index.ts`)

- `evaluarEquipo({ modelos, muestra, alPaso }): Promise<Recomendacion>`

## Dependencias

- **Puede importar:** `compartido/metricas`. Recibe `modelos-compartidos`, el transcriptor y el traductor por parámetro.
- **Lo usan:** `crear-evento`, `sesion-en-vivo`.

## Archivos previstos

- `placa.ts` · `medicion.ts` · `recomendacion.ts` · `index.ts`

## Pruebas

Reglas de recomendación con mediciones simuladas (placa sin f16, placa buena, sin WebGPU).

## Referencia

Documento de decisiones → "Decisión 24/09: local primero".
