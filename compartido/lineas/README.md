# lineas ♻

**Qué hace:** Arma la lista de líneas de subtítulos a medida que llegan: una línea con el mismo `id` reemplaza a la anterior en su lugar (provisoria → confirmada → corregida) y nunca se duplica; solo se recuerdan las últimas. La usan la sala (el historial para quien entra tarde) y todo el que mira (audiencia, vMix/OBS, monitoreo), para que los dos lados armen la lista igual.

**Qué NO hace:** Guardar nada ni conectarse.

## API pública (solo desde `index.ts`)

- `mezclarLinea(lineas, nueva, maximo?): Linea[]` · `MAXIMO_DE_LINEAS`

## Dependencias

- **Puede importar:** `compartido/contratos`.
- **Lo usan:** el Durable Object de la sala, `cliente-sala`, `audiencia`, `subtitulos-stream`, `produccion`, `monitoreo`.

## Pruebas

Una línea nueva va al final, una con el mismo id reemplaza en su lugar y solo se recuerdan las últimas.
