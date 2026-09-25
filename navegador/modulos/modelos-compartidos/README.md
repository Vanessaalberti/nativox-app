# modelos-compartidos ♻

**Qué hace:** Carga Whisper large-v3 turbo (Transformers.js + WebGPU) **una vez** en un worker y atiende los pedidos de transcripción de a uno, en orden (hay una sola placa de video). Elige la versión según la placa: con `shader-f16`, codificador sin comprimir (fp16); sin eso, comprimido (q4, ~0,76 GB). La primera pasada, que compila los shaders, se hace al cargar. Los archivos quedan en la caché del navegador: la segunda vez carga sin internet.

**Qué NO hace:** Decidir qué modelo usar según la velocidad (eso es `evaluar-equipo`). Es un Web Worker por pestaña: varias salas en una computadora cargan una copia cada una.

## API pública (solo desde `index.ts`)

- `elegirVarianteWhisper(): Promise<Resultado<"fp16" | "q4">>` — sin WebGPU, un resultado con qué hacer.
- `conectarModelos(worker): Modelos` — el worker lo crea quien lo usa (`new Worker(new URL(".../segundo-plano/modelos.worker.ts", import.meta.url), { type: "module" })`).
  - `cargarWhisper(variante, alAvanzar(cargado, total))`
  - `transcribir(audio, { prompt, idioma })` → `{ texto, ms }`
  - `cargarGemma(variante, alAvanzar)` y `traducirGemma({ texto, de, a })` → `{ texto, ms }`: TranslateGemma 4B (`onnx-community/translategemma-text-4b-it-ONNX`), en el mismo worker y la misma cola que Whisper (una sola placa). Con f16 baja ~2,1 GB (q4f16); sin f16, ~3,1 GB (q4). Se guarda en OPFS y se calienta al cargar (la primera traducción tarda ~9 s más).
- `medirGuardados()` → bytes que este sitio tiene guardados en el navegador.
- `borrarGuardados()` → borra todo lo que este sitio guardó (Cache API y OPFS: Whisper, ONNX Runtime, Bergamot) y dice cuánto liberó. Los modelos que ya están en memoria siguen hasta recargar.

**Lado del worker:** `en-worker.ts` → `atenderPedidos(self)`. Es la segunda entrada del módulo (la usa `navegador/segundo-plano/modelos.worker.ts`); no se importa desde la página, para no sumar Transformers.js al paquete principal.

**El prompt va a mano:** Transformers.js declara `prompt_ids` pero no lo aplica. Se arma como Whisper: `<|startofprev|>` + el prompt (los últimos 223 tokens) + `<|startoftranscript|><|idioma|><|transcribe|><|notimestamps|>`, y se descuenta de la salida.

## Dependencias

- **Puede importar:** `compartido/contratos` (`Resultado`), `@huggingface/transformers` (solo en el worker).
- **Lo usan:** `sesion-en-vivo` (se lo pasa a `transcripcion`); `evaluar-equipo`.

## Archivos

- `protocolo.ts` · `whisper.ts` · `gemma.ts` · `cache-en-disco.ts` · `en-worker.ts` · `cliente.ts` · `variante.ts` · `guardados.ts` · `index.ts`

## Pruebas

Se prueba en el navegador (necesita WebGPU): ver "Cómo se probó" en el changelog.

## Referencia

Documento de decisiones → "Motores" y "Varias salas en una computadora".
