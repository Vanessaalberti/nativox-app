# Herramientas y configuración

Como las carpetas están en español, la configuración apunta a ellas:

| Archivo | Qué fija |
| --- | --- |
| `package.json` | Además de las dependencias, la configuración de Prettier (`prettier`), knip (`knip`: dead code; `compartido/*/index.ts` cuentan como entrada) y jscpd (`jscpd`: duplicación de 5 líneas o más). Scripts: `dev`, `construir`, `revisar`, `probar`, `formatear`, `tipos`, `deploy` (migraciones D1 + `wrangler deploy`; el nombre `deploy` lo espera el botón de Cloudflare). Versiones fijadas |
| `tsconfig.json` + `configuracion/` | Opciones comunes en la raíz y un proyecto por zona en `configuracion/` (ver su README). `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; alias `@navegador/*`, `@compartido/*`, `@servidor/*` |
| `eslint.config.js` | `typescript-eslint` (con tipos), `eslint-plugin-boundaries` (reglas de `arquitectura.md`), `no-floating-promises`, `no-explicit-any`, `max-lines`, `complexity`, `no-console` |
| `.gitleaks.toml` | Detección de secretos *(falta crearlo)* |
| `vite.config.ts` | React + `@cloudflare/vite-plugin` (sin bindings remotos: el desarrollo funciona sin internet) + PWA *(falta)*; encabezados COOP/COEP en desarrollo (en producción los pone `publico/_headers`, solo en las rutas que corren modelos); `publicDir: "publico"`; compila también el componente embebible |
| `wrangler.jsonc` | `main: "servidor/entrada/index.ts"`, assets, D1 `DB` con `migrations_dir: "migraciones"`, Durable Object `SALA`, binding `AI`; `compatibility_date` del día de creación y `nodejs_compat`. **Sin secretos declarados** (el botón se los pediría a cada organizador) |
| `vitest.config.ts` · `playwright.config.ts` | Pruebas unitarias y de punta a punta *(Playwright: falta)* |

## Dependencias aprobadas

| Para | Paquete |
| --- | --- |
| Interfaz | `react`, `react-dom`, `react-router` |
| Estilos | `tailwindcss`, `@tailwindcss/vite` (su plugin oficial para Vite) |
| Datos del servidor | `@tanstack/react-query` |
| Validación | `valibot` (liviano, sirve en el navegador y en el servidor) |
| Transcripción local | `@huggingface/transformers` |
| Traducción liviana | `@browsermt/bergamot-translator` |
| Servidor | `wrangler`, `@cloudflare/vite-plugin` (tipos con `wrangler types`) |
| Build | `vite`, `@vitejs/plugin-react` (los trae la plantilla oficial de Cloudflare) |
| Tipos | `@types/node`, `@types/react`, `@types/react-dom` |
| Calidad | `typescript`, `eslint`, `typescript-eslint`, `eslint-plugin-boundaries`, `eslint-import-resolver-typescript` (para que los límites de import entiendan los alias `@navegador/*`…), `prettier`, `knip`, `jscpd`, `vitest`, `@playwright/test` |

Cualquier otra dependencia se aprueba antes de sumarla, se verifica en npm (paquete oficial, mantenido, sin `postinstall` raro) y se suma a esta tabla.
