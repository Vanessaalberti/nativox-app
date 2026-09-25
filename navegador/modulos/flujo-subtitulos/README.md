# flujo-subtitulos ♻

**Qué hace:** Orquesta una sesión: bloque de audio → cortador → transcripción → borrado de lo repetido → corrección con el glosario → corrección del límite con la línea anterior → traducción a **los idiomas de la sala** → líneas. Garantiza **una línea = un segmento** (provisoria → confirmada → traducida, siempre con el mismo `id`; una corrección actualiza esa línea, nunca agrega otra). Mientras se habla, hace pasadas provisorias (texto en vivo) cuando la placa está libre. Ajusta el mínimo del cortador a lo que tarda cada pasada (promedio de las últimas 5 × 1,2 + 0,3 s, entre 1,5 y 4 s). Mide cada línea.

**Qué NO hace:** Capturar audio ni conectarse a la red: recibe el cortador, el transcriptor y el traductor por parámetro (`PiezasDelFlujo`) y avisa por callbacks.

## API pública (solo desde `index.ts`)

- `crearFlujoSubtitulos(opciones) → { agregarAudio(bloque), terminar(), corregirLinea(id, { original, traducciones }) }` — `corregirLinea` es para cuando alguien corrige una frase a mano: se publica como cualquier cambio, pasa a ser el contexto de lo que sigue, rehace las traducciones que no se escribieron a mano y lo escrito a mano no se pisa después.
  - Piezas: `cortador`, `transcribir` (ya sin alucinaciones), `quitarRepetido`, `crearAcuerdo`, `traducir` (ya con glosario, contexto y cola).
  - Opciones: `idSesion`, `idiomaOriginal`, `idiomasDestino`, `glosario`, `pasadaProvisoriaCadaMs` (0 = solo frases enteras), `ahoraMs`.
  - Avisos: `alCambiarLinea(linea)` (la línea completa, con `compartido/contratos`), `alMedir({ numero, transcripcionMs, traduccionMs, retrasoConfirmacionSegundos, retrasoTraduccionSegundos })`, `alFallar(motivo)`.
- `corregirLimite(anterior, nuevo, glosario)` — "…como Workers Day" | "de AI de Cloudflare" → "…como Workers AI" | "de Cloudflare".

Orden: en local cada fragmento se procesa después del anterior (una sola placa). Primero se traduce la línea nueva y después la corrección de la anterior. En la nube también se procesa en orden (un pedido por frase, uno después del otro), así que no hay respuestas desordenadas que reordenar.

## Dependencias

- **Puede importar:** `compartido/glosario`, `compartido/contratos`. Recibe los demás módulos por parámetro.
- **Lo usan:** `sesion-en-vivo`; landing ("Probar").

## Archivos

- `tipos.ts` · `flujo.ts` · `correccion-de-limite.ts` · `minimo-adaptativo.ts` · `index.ts`

## Pruebas

Varios idiomas en la misma línea; orden; "Workers Day" | "de AI" se une en la línea anterior y se vuelve a traducir después de la nueva; nunca dos líneas para el mismo segmento; glosario antes de traducir; línea vacía sin traducir; falla de transcripción que no corta la sesión; mediciones.

## Referencia

Documento de decisiones → "Traducción en vivo" (orden, una línea = un segmento, corrección de la línea anterior) y "Cómo se corta y se manda el audio" (mínimo adaptativo).
