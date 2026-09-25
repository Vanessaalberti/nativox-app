# traduccion ♻

**Qué hace:** Traductores con una misma interfaz (`Traductor`: `traducir(texto, de, a) → Resultado<string>`); cada uno declara qué marca del glosario respeta (`clave`, `html` o `codigo`) y su nivel (`rapido` o `calidad`). Lo común vive acá: glosario protegido, contexto de la oración sin terminar (último tramo después de la última coma, hasta 8 palabras), control de confianza (75 % de las palabras o más y sin términos perdidos; si no, se traduce el fragmento solo) y una cola por traductor. Un traductor nuevo hereda todo con solo declarar su marca.

**Qué NO hace:** Ordenar líneas en pantalla (eso es `flujo-subtitulos`).

## API pública (solo desde `index.ts`)

- `Traductor`
- `crearBergamot(urlBiblioteca) → Promise<Resultado<Traductor>>` — marca `clave`, texto sin HTML. Los modelos (~22 MB por dirección) y la lista de modelos se guardan en la caché del navegador: después funciona sin internet. Español ↔ portugués pasa por el inglés (no hay modelo directo).
- `traducirConContexto(traductor, { texto, contexto, glosario, de, a }) → Resultado<{ texto, terminosPerdidos, usoContexto }>`
- `ultimoTramoSinCerrar(anterior)` — vacío si la línea anterior terminó en `.`, `?`, `!` o `…`.
- `crearCola()` — las tareas salen de a una y en el orden en que se pidieron; una que falla no traba las siguientes.

- `crearTranslateGemma(servicio) → Traductor` — TranslateGemma 4B (marca `codigo`, nivel `calidad`). Recibe por parámetro un `ServicioGemma` (`traducir({ texto, de, a })`), que da `modelos-compartidos`. Traduce mejor (normaliza números, modismos por el sentido) pero pesa ~2 a 3 GB y tarda ~2 a 3 s por idioma en una placa modesta: es una opción, no el camino por defecto.

## Por qué Bergamot usa `clave` y no `html`

Medido el 24/09 en el navegador: el modelo inglés→portugués de Bergamot traduce y parte lo que va dentro de `<span data-g>` ("`<span>rate limit</span>`" → "`<span>limite</span> de <span>taxa</span>`", y al restaurar quedaba "rate limit de rate limit"). Con códigos opacos de letras (`NTXA`, `NTXB`…) los dos tramos (es→en→pt) los copian tal cual, y hasta reordenan bien ("run NTXD NTXC" = "run the CI/CD pipeline tests"). Con códigos de números parecidos (`X1Q`, `X2W`) los mezcla; con nombres inventados los conjuga. El contexto va en su propio renglón, que Bergamot conserva.

## Dependencias

- **Puede importar:** `compartido/glosario`, `compartido/contratos`.
- **Lo usan:** `sesion-en-vivo` (lo pasa a `flujo-subtitulos`), `evaluar-equipo`.

## Archivos

- `tipos.ts` · `traductores/bergamot.ts` · `traductores/translategemma.ts` · `contexto.ts` · `con-contexto.ts` · `cola.ts` · `index.ts`
- Bergamot se publica tal cual en `/bergamot/` (ver `vite.config.ts`): crea su propio worker con rutas relativas a su archivo.

## Pruebas

Contexto con marca `html` y de código; se descarta el contexto si vuelve corto o pierde un término; traducción fija del glosario; cola en orden y que sigue después de una falla. En el navegador (guion de prueba, 5 frases): los términos del glosario llegan bien a inglés y portugués.

## Referencia

Documento de decisiones → "Traducción en vivo, fragmento por fragmento" y "Glosario (formato y usos)".
