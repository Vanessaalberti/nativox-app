# modulos ♻ — catálogo de lógica reutilizable del navegador

**Antes de escribir lógica nueva, buscá acá.** Cada módulo tiene un `README.md` con su API y solo se importa desde su `index.ts`.

| Módulo | Qué resuelve |
| --- | --- |
| `captura-audio` | Tomar audio de la entrada del equipo, el micrófono, un archivo o una pestaña, a 16 kHz |
| `cortador-audio` | Cortar en pausas, recortar silencios, contexto de audio |
| `codificador-opus` | Audio → Opus en `.ogg` (para la nube) |
| `transcripcion` | Motores de transcripción con una misma interfaz + transcripción en vivo con texto provisorio |
| `traduccion` | Traductores con una misma interfaz, contexto, control de confianza y colas |
| `flujo-subtitulos` | Orquesta todo: orden, una línea por segmento, correcciones y traducción en vivo |
| `modelos-compartidos` | Carga los modelos una vez y los comparte entre salas (SharedWorker) |
| `evaluar-equipo` | "Evaluar esta computadora": mide y recomienda |
| `autorreparacion` | Detecta fallas y repara en tres pasos |
| `cliente-sala` | Cliente WebSocket de la sala: publicar y recibir subtítulos, señales y comandos |

Además, en `compartido/`: `glosario`, `exportar-subtitulos`, `metricas`.

Reglas específicas: `documentacion/convenciones.md` → "Módulos reutilizables".
