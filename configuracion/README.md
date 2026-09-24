# configuracion

Proyectos de TypeScript, uno por zona. `tsconfig.json` (en la raíz) tiene las opciones comunes (modo estricto y alias `@navegador/*`, `@compartido/*`, `@servidor/*`) y los referencia; tiene que quedar en la raíz porque es el que buscan los editores.

| Archivo | Qué revisa | Particularidad |
| --- | --- | --- |
| `tsconfig.navegador.json` | `navegador/` y `compartido/` | Con DOM y los tipos de Vite |
| `tsconfig.servidor.json` | `servidor/` y `compartido/` | Sin DOM ni tipos de Node: los de Cloudflare entran con `servidor/plataforma/env.d.ts` (`wrangler types`) |
| `tsconfig.herramientas.json` | `vite.config.ts`, `vitest.config.ts` y las pruebas (`*.test.ts`) | Con los tipos de Node y de Vite (las pruebas leen `muestras/` con `?raw`) |

`compartido/` entra en los dos primeros a propósito: así se comprueba que no usa nada del DOM ni de Cloudflare.
