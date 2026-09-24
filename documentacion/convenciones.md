# Convenciones de código limpio

## Idioma y nombres

- **Todo en español:** textos de la interfaz, documentos, comentarios, nombres de archivos, carpetas e identificadores.
- En los identificadores, **sin tildes ni ñ** (`contrasena`, `anio`, `transcripcion`): evita problemas de codificación y de teclado.
- Los nombres propios de APIs y librerías quedan como son (`fetch`, `WebSocket`, `AudioEncoder`).
- Nombres que dicen qué es, no cómo está hecho: `cortarEnPausas`, no `procesarAudio2`. Sin abreviaturas raras.
- Booleanos como pregunta: `estaEnVivo`, `tieneF16`. Funciones como verbo en infinitivo: `corregirTranscripcion`.
- Archivos en `kebab-case.ts`; componentes React en `PascalCase.tsx` (`PantallaEscenario.tsx`).

## Funciones y archivos

- **Una responsabilidad por función.** Si hace falta "y" para describirla, son dos.
- Funciones puras primero: la lógica sin DOM ni red va separada y con pruebas.
- Límites orientativos (el lint avisa): ~50 líneas por función, ~300 por archivo, 4 parámetros (si hay más, un objeto con nombre).
- Sin efectos al importar un archivo (nada se ejecuta solo al importarlo).
- Dependencias por parámetro en los bordes de los módulos (el motor de transcripción se pasa, no se importa): así se prueban y se reemplazan.

## Errores

- Los errores esperables (sin micrófono, sin WebGPU, cuota agotada) se modelan como resultado (`{ ok: false, motivo }`), no como excepción.
- Los inesperados se propagan con contexto (`cause`) y se registran una sola vez, en el borde.
- **Prohibido:** `catch` vacío, `catch` que solo hace `console.log`, promesas sin `await`, valores por defecto que ocultan una falla.
- En la interfaz, cada error tiene un mensaje que dice qué pasó y qué hacer.

## Comentarios

- Explican **por qué** (una decisión, una medición, un límite de una API). El qué lo dice el código.
- Sin código comentado (para eso está git). Sin `TODO` sin responsable ni issue.

## Tipos y datos

- TypeScript estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- Todo lo que entra de afuera (pedidos HTTP, mensajes WebSocket, D1, respuestas de IA, localStorage) se valida con un esquema de `compartido/contratos` antes de usarse.
- Sin `any`. Sin `as` para callar al compilador.

## Módulos reutilizables (`navegador/modulos/`, `compartido/`, `servidor/modulos/`)

- Un módulo no sabe que existe Nativox: nada de "sala", "operador" ni rutas en su API (nombres genéricos: `transmision`, `sesion`).
- Solo importa `compartido/` (y lo que su README declare). **Nunca** `funcionalidades/`, `rutas/`, `interfaz/` ni `arranque/`.
- Las dependencias externas (motor, traductor, reloj, almacenamiento) entran por parámetro: se prueban sin navegador real.
- Sin React. Si hace falta un hook, va en la funcionalidad que lo usa.
- Todo cambio de API pública actualiza el `README.md` del módulo en el mismo PR.

## Servidor (Cloudflare)

- **Sin estado global por pedido:** nada de datos de un pedido en variables del módulo. Lo que persiste va a D1 o al Durable Object.
- **Toda promesa se espera, se devuelve o va a `ctx.waitUntil()`.**
- **Bindings, no REST:** D1, Durable Objects y Workers AI por binding. Tipos de `env` generados con `wrangler types`.
- **Secretos** (webhook de Discord, claves de sesión) nunca en `wrangler.jsonc`, en los logs ni en respuestas al navegador.
- **Autorización en cada pedido:** un operador solo ve y controla sus salas.
- **Errores con `try/catch` explícito** y respuesta estructurada; no usar `passThroughOnException()`.
- **Tokens** con `crypto.getRandomValues()` o `crypto.randomUUID()`; los secretos se comparan en tiempo constante.

## Terminado

`npm run revisar` en verde + probado en el navegador + decir qué no se pudo verificar. Si una decisión no está documentada, se pregunta antes de inventarla.

## React

- Componentes chicos; la lógica va en hooks de la funcionalidad o en `modulos/`.
- Estado del servidor con un cliente de datos; estado local lo más cerca posible de donde se usa.
- Accesibilidad: controles con etiqueta, foco visible, contraste del sistema de diseño.
