# Malas costumbres de la IA al programar y cómo las frena este proyecto

Nativox se construye con ayuda de IA. Estas son las fallas más documentadas del código generado por IA y la mitigación concreta de cada una. Regla general: **lo importante no depende de que alguien se acuerde; lo hace cumplir una herramienta o la estructura.**

| Mala costumbre | Qué se observó | Mitigación en Nativox | Quién la hace cumplir |
| --- | --- | --- | --- |
| **Duplicar código** en vez de reutilizar | GitClear (211 millones de líneas): los bloques duplicados de 5 líneas o más se multiplicaron ×8 en 2024; en 2026, +81% | Catálogo de módulos (`navegador/modulos/README.md`, `compartido/README.md`); regla "buscá antes de crear"; una sola API pública por módulo | `jscpd` en la integración continua; revisión del PR |
| **Dejar de refactorizar** y reescribir código a las dos semanas | Refactorización −40%; código reescrito en alza | Cambios chicos; funciones puras con pruebas que permiten refactorizar sin miedo | Plantilla de PR; pruebas |
| **Dependencias inventadas** (*slopsquatting*) | USENIX Security 2025: 576.000 muestras; 51% de los paquetes alucinados eran inventados y 38% mezclas de nombres reales | Lista de dependencias aprobadas; toda dependencia nueva se aprueba y se verifica en npm; archivo de bloqueo; sin scripts `postinstall` | `herramientas.md`; revisión; `npm ci` |
| **Aflojar una prueba para que pase** o pruebas que no prueban nada | Pruebas sin aserciones reales en buena parte del código generado | Nunca cambiar lo esperado sin explicarlo; pruebas con datos reales (`muestras/`); umbrales de WER y términos | `calidad.yml`; plantilla de PR |
| **Errores silenciados** | GitClear 2026: construcciones que esconden errores +47% | `catch` vacío y promesas sueltas prohibidos; errores esperables como resultado | ESLint: `no-empty`, `@typescript-eslint/no-floating-promises`, `no-misused-promises` |
| **Sobre-ingeniería** y abstracciones especulativas | Capas, "administradores" y configuraciones para casos que no existen | Se abstrae al 2.º o 3.er uso real; sin carpetas genéricas; cada módulo dice qué NO hace | Revisión; README de cada módulo |
| **Reinventar lo que ya existe** | Código hecho a mano en vez de usar la plataforma o librerías probadas | Usar la plataforma (WebCodecs, WebGPU, `crypto.subtle`, bindings de Cloudflare) y las librerías aprobadas | `herramientas.md` |
| **APIs inventadas o viejas** | Métodos que no existen o de versiones anteriores | Verificar en la documentación oficial; versiones fijadas; tipos del servidor generados con `wrangler types` | TypeScript estricto; `wrangler types` |
| **Patrones inconsistentes** entre archivos | Cada archivo resuelve lo mismo de otra forma | Convenciones escritas; plantilla de módulo; formato automático | `convenciones.md`; Prettier; ESLint |
| **Archivos y funciones gigantes** | Todo en un archivo | Límites orientativos de tamaño | ESLint: `max-lines`, `max-lines-per-function`, `complexity` (aviso) |
| **Comentarios de relleno** o desactualizados | Comentarios que repiten el código o quedan viejos | Comentarios solo del porqué; sin código comentado | Revisión; ESLint (`no-warning-comments` para TODO sin issue) |
| **Código muerto** y restos | Exports sin uso, archivos huérfanos, `console.log` | Se elimina en el mismo PR | `knip`; ESLint `no-console` (salvo el registrador) |
| **Tipos débiles** | `any`, `as` para callar errores | TypeScript estricto; validación en los bordes con esquemas | `tsc --noEmit`; ESLint `no-explicit-any` |
| **Secretos en el código** y datos sin validar | Keys pegadas en el código, datos de afuera usados sin validar | Secretos solo en el servidor; validación con `compartido/contratos` | `gitleaks`; revisión |
| **Cambios fuera del pedido** | Refactors de paso, archivos que nadie pidió tocar | Un PR = un cambio; límites de import | Plantilla de PR; `eslint-plugin-boundaries` |
| **Decir "listo" sin verificar** | Se declara terminado sin correrlo | Terminado = `npm run revisar` + prueba en el navegador + decir qué no se verificó | `convenciones.md`; plantilla de PR |
| **Estado global en el servidor** | Datos de un pedido en variables del módulo (se mezclan entre pedidos) | Estado por pedido por parámetro; lo persistente en D1 o en el Durable Object | `convenciones.md` → "Servidor"; revisión |
| **Mezclar idiomas** | Identificadores en inglés y textos en español, sin criterio | Todo en español, sin tildes ni ñ en identificadores | `convenciones.md`; plantilla de PR |

## Cómo se trabaja con un agente

- Cada persona usa su agente con un `AGENTS.md` (y `CLAUDE.md`) **local**, que **no se sube al repositorio** (lo ignora `.gitignore`). Las reglas que valen para todos están en `convenciones.md` y en este documento; el archivo local solo las resume.
- Las instrucciones viejas son peores que ninguna: si cambia un proceso, se actualiza `convenciones.md` en el mismo PR.
- Tareas chicas y concretas, con el README del módulo como contrato.
- Cuando el agente no sabe algo o la decisión no está escrita, pregunta.

## Fuentes

- GitClear, *AI Copilot Code Quality 2025* y *The Maintainability Gap 2026*.
- USENIX Security 2025, estudio de alucinación de paquetes (576.000 muestras, 16 modelos).
- Cloudflare, *Workers best practices*.
- agents.md (formato abierto de instrucciones para agentes).
