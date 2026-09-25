# modulos ♻ — catálogo de lógica reutilizable del navegador

**Antes de escribir lógica nueva, buscá acá.** Cada módulo tiene un `README.md` con su API y solo se importa desde su `index.ts`.

| Módulo | Qué resuelve |
| --- | --- |
| `captura-audio` | Tomar audio de la entrada del equipo, el micrófono, un archivo o una pestaña, a 16 kHz |
| `cortador-audio` | Cortar en pausas, recortar silencios, contexto de audio |
| `transcripcion` | Motores de transcripción con una misma interfaz + transcripción en vivo con texto provisorio |
| `traduccion` | Traductores con una misma interfaz, contexto, control de confianza y colas |
| `flujo-subtitulos` | Orquesta todo: orden, una línea por segmento, correcciones y traducción en vivo |
| `modelos-compartidos` | Carga los modelos una vez y los comparte entre salas (SharedWorker) |
| `evaluar-equipo` | "Evaluar esta computadora": detecta la placa, mide su potencia y recomienda versión de Whisper, nivel de velocidad y si conviene la nube |
| `cliente-instancia` | Las llamadas del navegador a `/api` de la propia instancia: estado, cuenta, ingreso, recuperación y evento |
| `cliente-sala` | Cliente WebSocket de la sala: publicar y recibir subtítulos, señales y comandos |

Además, en `compartido/`: `glosario`, `exportar-subtitulos`, `metricas`.

Reglas específicas: `documentacion/convenciones.md` → "Módulos reutilizables".
