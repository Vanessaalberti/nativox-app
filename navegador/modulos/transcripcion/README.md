# transcripcion ♻

**Qué hace:** Motores de transcripción con una misma interfaz (`transcribir(fragmento, { prompt, idioma }) → { texto, palabras?, alucino }`); cada motor declara sus límites y su precio. Incluye el filtro de alucinaciones (cierres de YouTube en es/en/pt, con un reintento sin contexto), el borrado de lo repetido por el contexto de audio y la transcripción en vivo con texto provisorio (LocalAgreement: se confirma lo que coincide en dos pasadas).

**Qué NO hace:** Cortar audio, traducir ni ordenar líneas. No carga modelos directamente: se los pide a `modelos-compartidos`.

## API pública (solo desde `index.ts`)

- `Transcriptor` (interfaz) e `InfoMotor` (límites, precio, `vadPropio`)
- `crearWhisperLocal(modelos, { variante })`
- `crearWorkersAi(cliente, { formato })`
- `crearTranscriptorEnVivo(transcriptor, { pasadaCadaSegundos })`
- `limpiarAlucinaciones(texto, prompt)`

## Dependencias

- **Puede importar:** `compartido/glosario`, `compartido/contratos`.
- **Lo usan:** `flujo-subtitulos`, `evaluar-equipo`.

## Archivos previstos

- `motores/whisper-local.ts` · `motores/workers-ai.ts` · `en-vivo/acuerdo-local.ts` · `alucinaciones.ts` · `superposicion.ts` · `index.ts`

## Pruebas

Alucinaciones reales ("Gracias por ver el video…"); reintento una sola vez; provisorio → confirmado; motor falso para las pruebas.

## Referencia

Documento de decisiones → "Motores", "Prioridad de latencia" y "Transcripción en vivo de verdad".
