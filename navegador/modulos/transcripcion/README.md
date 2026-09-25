# transcripcion ♻

**Qué hace:** Motores de transcripción con una misma interfaz (`Transcriptor`: `transcribir(audio, { prompt, idioma }) → Resultado<{ texto, ms }>`); cada motor declara si es local y si saca los silencios por su cuenta. Lo que mejora la transcripción vive afuera del motor y vale para cualquiera: el filtro de alucinaciones (cierres de YouTube en es/en/pt, con un reintento sin prompt), el borrado de lo repetido por el contexto de audio y el acuerdo entre pasadas para el texto en vivo (LocalAgreement).

**Qué NO hace:** Cortar audio, traducir ni ordenar líneas. No carga modelos: el motor local recibe quien los aloja (`modelos-compartidos`) por parámetro.

## API pública (solo desde `index.ts`)

- `Transcriptor`, `InfoMotor`, `OpcionesTranscripcion`
- `crearWhisperLocal(servicio)` — `servicio` es cualquier cosa con `transcribir(audio, opciones)` (en la app, `conectarModelos(...)`).
- `limpiarAlucinaciones(texto) → { texto, alucino }`
- `transcribirSinAlucinaciones(transcriptor, audio, opciones)` — si borró algo, reintenta **una** vez sin prompt (en la nube, cuenta como un pedido más).
- `borrarSuperposicion(anterior, nuevo)` — busca el final de lo anterior (hasta 10 palabras) al principio de lo nuevo, con hasta 2 palabras sueltas antes (el contexto puede empezar a mitad de una palabra). Una sola palabra repetida solo se borra si tiene 4 letras o más.
- `crearAcuerdoLocal()` → `agregarPasada(texto) → { estable, provisorio }` y `reiniciar()`: lo que dos pasadas seguidas dicen igual al principio queda estable y no retrocede.

Previsto (paso 11): `crearWorkersAi(cliente, { formato })`.

## Dependencias

- **Puede importar:** `compartido/contratos` (`Resultado`).
- **Lo usan:** `sesion-en-vivo` (lo pasa a `flujo-subtitulos`), `evaluar-equipo`.

## Archivos

- `tipos.ts` · `texto.ts` · `motores/whisper-local.ts` · `alucinaciones.ts` · `superposicion.ts` · `en-vivo/acuerdo-local.ts` · `index.ts`

## Pruebas

Alucinaciones reales ("Gracias por ver el video", "Suscribite", Amara.org, "Thanks for watching", "Obrigado por assistir") sin tocar frases reales ("Nos vemos en el próximo Nerdearla", "subscribe to the topic"); un solo reintento; superposición con palabra cortada; provisorio → estable ("Answer." → "And so, my fellow…").

## Referencia

Documento de decisiones → "Motores", "Cómo se corta y se manda el audio" y "Prioridad de latencia" (transcripción en vivo de verdad).
