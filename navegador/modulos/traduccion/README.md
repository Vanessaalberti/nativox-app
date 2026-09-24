# traduccion ♻

**Qué hace:** Traductores con una misma interfaz (`traducir(texto, de, a, { marca }) → texto`); cada uno declara qué marca respeta (`html` o `codigo`) y su nivel (`rapido` o `calidad`). Lo común vive acá: protección del glosario, contexto de la oración sin terminar (último tramo, hasta 8 palabras), control de confianza (75% de las palabras o más y sin términos perdidos) y una cola por traductor. Un traductor nuevo hereda todo con solo declarar su marca.

**Qué NO hace:** Ordenar líneas en pantalla (eso es `flujo-subtitulos`). No descarga modelos directamente.

## API pública (solo desde `index.ts`)

- `Traductor` (interfaz)
- `crearBergamot(modelos)` · `crearTranslateGemma(modelos)`
- `traducirConContexto(traductor, texto, { contexto, glosario, a })`
- `crearCola(traductor)`

## Dependencias

- **Puede importar:** `compartido/glosario`.
- **Lo usan:** `flujo-subtitulos`, `evaluar-equipo`.

## Archivos previstos

- `traductores/bergamot.ts` · `traductores/translategemma.ts` · `contexto.ts` · `confianza.ts` · `cola.ts` · `index.ts`

## Pruebas

Glosario protegido (56/56 con Bergamot, 52/56 con TranslateGemma); el contexto nunca empeora una traducción; calentamiento de TranslateGemma al cargar.

## Referencia

Documento de decisiones → "Traducción en vivo, fragmento por fragmento".
