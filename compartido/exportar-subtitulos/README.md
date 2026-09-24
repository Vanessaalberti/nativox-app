# exportar-subtitulos ♻

**Qué hace:** Convierte segmentos con marcas de tiempo reales en SRT, VTT o texto, con corrimiento de tiempo (para alinear con el video de YouTube).

**Qué NO hace:** Guardar ni descargar archivos (eso lo hace la interfaz).

## API pública (solo desde `index.ts`)

- `aSrt(segmentos, { corrimientoSegundos }): string`
- `aVtt(segmentos, { corrimientoSegundos }): string`
- `aTexto(segmentos, { corrimientoSegundos }): string` — un segmento por renglón, sin marcas de tiempo.

`Segmento` es `{ inicio, fin, texto }` (segundos). Quien exporta elige el idioma y arma los segmentos con ese texto: el módulo no sabe de idiomas ni de líneas de Nativox. El corrimiento negativo adelanta; lo que termina antes de 0 se descarta y lo que empieza antes queda en 0. Los renglones se parten en ~42 caracteres.

## Dependencias

- **Puede importar:** nada.
- **Lo usan:** `funcionalidades/agenda` (descarga), `servidor/api/transcripciones`.

## Archivos

- `segmentos.ts` (corrimiento, formato de tiempo, renglones) · `formatos.ts` (SRT, VTT, texto) · `index.ts`

## Pruebas

Redondeo de milisegundos y horas, corrimiento negativo y positivo (ninguna marca antes de 0), renglones largos, caracteres que VTT tomaría como marca.

## Referencia

Documento de decisiones → "Transcripción de cada charla".
