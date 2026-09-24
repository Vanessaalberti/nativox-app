# flujo-subtitulos ♻

**Qué hace:** Orquesta una sesión: fragmento → transcripción → corrección con el glosario → corrección del límite con la línea anterior → traducción a **los idiomas de la sala** → líneas en orden. Garantiza **una línea = un segmento** (una corrección actualiza esa línea, nunca agrega otra) y que cada línea se muestra cuando la anterior ya se mostró.

**Qué NO hace:** Capturar audio ni conectarse a la red: recibe el transcriptor, los traductores y el cortador por parámetro y emite eventos.

## API pública (solo desde `index.ts`)

- `crearFlujoSubtitulos({ cortador, transcriptor, traductores, glosario, idiomas })`
- eventos: `linea:nueva`, `linea:actualizada`, `linea:traducida`, `estadisticas`

## Dependencias

- **Puede importar:** `compartido/glosario`, `compartido/contratos` (forma de una línea). Recibe los demás módulos por parámetro.
- **Lo usan:** `sesion-en-vivo`, `pantalla-escenario` (lee las líneas), landing ("Probar").

## Archivos previstos

- `flujo.ts` · `orden.ts` · `correccion-de-limite.ts` · `lineas.ts` · `index.ts`

## Pruebas

Respuestas desordenadas de la nube salen en orden; "Workers Day" | "de AI" se une en la línea anterior y se vuelve a traducir; nunca dos líneas para el mismo segmento.

## Referencia

Documento de decisiones → "Traducción en vivo" (orden, una línea = un segmento, corrección de la línea anterior).
