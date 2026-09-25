# glosario ♻

**Qué hace:** Lee el glosario (`término`, `término ~ variantes`, `término => en: X | pt: Y`), arma el prompt para Whisper (hasta 224 tokens, por prioridad), corrige la transcripción (variantes, parecido de 1–2 letras en términos largos, siglas exactas, siglas con barra, términos de varias palabras con palabras cortas en el medio) y protege los términos al traducir (marca `clave`, `html` o `codigo`) y los restaura.

**Qué NO hace:** Transcribir ni traducir. No decide qué términos sugerir (eso lo hace `servidor/api/ia` con Gemma).

## API pública (solo desde `index.ts`)

- `leerGlosario(texto): EntradaGlosario[]`
- `armarPromptWhisper(entradas, textoAnterior): string`
- `corregirTranscripcion(texto, entradas): { texto, correcciones }`
- `proteger(texto, entradas, idiomaDestino, marca): TextoProtegido` — `marca`: `"clave"` (códigos opacos `NTXA`, `NTXB`…; la usa Bergamot), `"html"` (`<span data-g>`) o `"codigo"` (acentos graves; modelos de lenguaje). Usa la traducción fija del idioma destino si la hay. Por qué Bergamot usa `clave`: `navegador/modulos/traduccion/README.md`.
- `restaurar(traducido, protegido): { texto, terminosPerdidos }` — perdido = el término no quedó en el texto final, con o sin marca.

## Dependencias

- **Puede importar:** `compartido/distancia-edicion` (parecido de 1–2 letras).
- **Lo usan:** `navegador/modulos/transcripcion`, `flujo-subtitulos`, `traduccion`, `servidor/api/ia`.

## Archivos

- `leer.ts` · `texto.ts` (palabras y normalización) · `buscar.ts` (las cuatro formas de encontrar un término) · `prompt-whisper.ts` · `corregir.ts` · `proteger.ts` · `index.ts`
- `glosario.test.ts` con los casos medidos y el guion de `muestras/referencias/guion-prueba.*`

## Cómo encuentra un término

| Forma | Ejemplo | Cuándo |
| --- | --- | --- |
| Exacta (sin mayúsculas ni tildes) o variante `~` | "github" → GitHub · "ner de arla" → Nerdearla | Siempre (también al proteger) |
| Sigla con barra | "CI y CD", "CI CD", "CI-CD" → CI/CD | Siglas de hasta 4 letras por parte |
| Con palabras intercaladas | "Workers Day de AI" → Workers AI | Hasta 2 palabras de ≤ 4 letras en total |
| Parecida | "pul request" → pull request · "Conex" → Konex | Términos de ≥ 5 letras y sin números: 1 letra de diferencia (2 desde 8 letras). Misma cantidad de palabras que el término; los plurales no cuentan |

Ninguna forma cruza comas ni puntos. Si dos coincidencias se pisan, gana la más larga ("API key" sobre "API").

## Pruebas

Casos reales del laboratorio: "Workers Day de AI" → "Workers AI", "CI y CD" → "CI/CD", "pul request" → "pull request", sin comerse palabras vecinas ("rollback a"), y una palabra corta del término no cambia entera por parecido ("Workers Day" no se vuelve "Workers AI": eso lo resuelve la corrección del límite entre líneas). Protección: los 56 términos del guion (28 en inglés y 28 en portugués) vuelven con las tres marcas. El guion bien escrito no se "corrige".

## Referencia

Documento de decisiones → "Glosario (formato y usos)".
