# Herramientas y configuración

Como las carpetas están en español, la configuración apunta a ellas:

| Archivo | Qué fija |
| --- | --- |
| `package.json` | Scripts: `dev`, `construir`, `revisar`, `probar`, `formatear`, `tipos`, `deploy` (migraciones D1 + `wrangler deploy`; el nombre `deploy` lo espera el botón de Cloudflare). Versiones fijadas |
| `tsconfig.json` (+ `tsconfig.base.json`, `.navegador`, `.servidor`, `.node`, `.pruebas`: las pruebas usan `?raw` de Vite para leer `muestras/`) | Un proyecto por zona (el servidor sin DOM, con los tipos de `wrangler types`). `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; alias `@navegador/*`, `@compartido/*`, `@servidor/*` |
| `eslint.config.js` | `typescript-eslint` (con tipos), `eslint-plugin-boundaries` (reglas de `arquitectura.md`), `no-floating-promises`, `no-explicit-any`, `max-lines`, `complexity`, `no-console` |
| `.prettierrc.json` | Formato único |
| `knip.json` | Código muerto: exports, archivos y dependencias sin uso |
| `.jscpd.json` | Umbral de duplicación |
| `.gitleaks.toml` | Detección de secretos *(falta crearlo)* |
| `vite.config.ts` | React + `@cloudflare/vite-plugin` (sin bindings remotos: el desarrollo funciona sin internet) + PWA *(falta)*; encabezados COOP/COEP en desarrollo (en producción los pone `publico/_headers`, solo en las rutas que corren modelos); `publicDir: "publico"`; compila también el componente embebible |
| `wrangler.jsonc` | `main: "servidor/entrada/index.ts"`, assets, D1 `DB` con `migrations_dir: "migraciones"`, Durable Object `SALA`, binding `AI`; `compatibility_date` del día de creación y `nodejs_compat`. **Sin secretos declarados** (el botón se los pediría a cada organizador) |
| `vitest.config.ts` · `playwright.config.ts` | Pruebas unitarias y de punta a punta *(Playwright: falta)* |

## Dependencias aprobadas

| Para | Paquete |
| --- | --- |
| Interfaz | `react`, `react-dom`, `react-router` |
| Estilos | `tailwindcss` |
| Datos del servidor | `@tanstack/react-query` |
| Validación | `valibot` (liviano, sirve en el navegador y en el servidor) |
| Transcripción local | `@huggingface/transformers` |
| Traducción liviana | `@browsermt/bergamot-translator` |
| Servidor | `wrangler`, `@cloudflare/vite-plugin` (tipos con `wrangler types`) |
| Construcción | `vite`, `@vitejs/plugin-react` (los trae la plantilla oficial de Cloudflare) |
| Tipos | `@types/node`, `@types/react`, `@types/react-dom` |
| Calidad | `typescript`, `eslint`, `typescript-eslint`, `eslint-plugin-boundaries`, `eslint-import-resolver-typescript` (para que los límites de import entiendan los alias `@navegador/*`…), `prettier`, `knip`, `jscpd`, `vitest`, `@playwright/test` |

Cualquier otra dependencia se propone en el PR, se verifica en npm (paquete oficial, mantenido, sin `postinstall` raro) y se suma a esta tabla.
