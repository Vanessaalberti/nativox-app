import boundaries from "eslint-plugin-boundaries";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

// Zonas y reglas de import de documentacion/arquitectura.md. El orden importa: gana el primer
// patrón que coincide (por eso contratos va antes que el resto de compartido).
const zonas = [
  { type: "arranque", pattern: "navegador/arranque" },
  { type: "rutas", pattern: "navegador/rutas" },
  { type: "funcionalidad", pattern: "navegador/funcionalidades/*", capture: ["nombre"] },
  { type: "modulo", pattern: "navegador/modulos/*", capture: ["nombre"] },
  { type: "interfaz", pattern: "navegador/interfaz/*", capture: ["nombre"] },
  { type: "segundo-plano", pattern: "navegador/segundo-plano" },
  { type: "contratos", pattern: "compartido/contratos" },
  { type: "compartido", pattern: "compartido/*", capture: ["nombre"] },
  { type: "entrada", pattern: "servidor/entrada" },
  { type: "api", pattern: "servidor/api" },
  { type: "objeto-durable", pattern: "servidor/objetos-durables/*", capture: ["nombre"] },
  { type: "modulo-servidor", pattern: "servidor/modulos/*", capture: ["nombre"] },
  { type: "plataforma", pattern: "servidor/plataforma" },
];

const puedeImportar = (desde, hacia) => ({
  from: { element: { type: desde } },
  allow: { to: { element: { types: { anyOf: hacia } } } },
});

// Un módulo ♻ de compartido/ solo importa a otro si su README lo declara.
const dependenciasDeclaradas = {
  glosario: ["distancia-edicion"],
  metricas: ["distancia-edicion"],
};

const puedeImportarDeclarados = Object.entries(dependenciasDeclaradas).flatMap(([desde, hacia]) =>
  hacia.map((modulo) => ({
    from: { element: { type: "compartido", captured: { nombre: desde } } },
    allow: { to: { element: { type: "compartido", captured: { nombre: modulo } } } },
  })),
);

const politicas = [
  // Dentro de la propia carpeta, y paquetes externos o del entorno (react, node:, cloudflare:).
  { allow: { dependency: { relationship: { to: "internal" } } } },
  { allow: { to: { module: { origin: "external" } } } },
  { allow: { to: { module: { origin: "core" } } } },

  puedeImportar("arranque", ["rutas", "interfaz", "contratos", "compartido"]),
  puedeImportar("rutas", ["funcionalidad"]),
  puedeImportar("funcionalidad", ["modulo", "interfaz", "contratos", "compartido"]),
  puedeImportar("modulo", ["contratos", "compartido"]),
  puedeImportar("interfaz", ["contratos", "compartido"]),
  puedeImportar("segundo-plano", ["modulo", "contratos", "compartido"]),
  puedeImportar("compartido", ["contratos"]),
  ...puedeImportarDeclarados,

  puedeImportar("entrada", ["api", "objeto-durable", "plataforma", "contratos", "compartido"]),
  puedeImportar("api", ["modulo-servidor", "plataforma", "contratos", "compartido"]),
  puedeImportar("objeto-durable", ["modulo-servidor", "plataforma", "contratos", "compartido"]),
  puedeImportar("modulo-servidor", ["contratos", "compartido"]),
  puedeImportar("plataforma", ["contratos"]),
];

export default defineConfig(
  globalIgnores([
    "node_modules/",
    "dist/",
    ".wrangler/",
    "coverage/",
    "servidor/plataforma/env.d.ts",
  ]),

  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        project: [
          "./configuracion/tsconfig.navegador.json",
          "./configuracion/tsconfig.servidor.json",
          "./configuracion/tsconfig.herramientas.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
      "no-empty": "error",
      // "todo" es palabra común en español: solo se marca "TODO:" o "FIXME" al principio.
      "no-warning-comments": ["warn", { terms: ["todo:", "fixme"], location: "start" }],
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 50, skipBlankLines: true, skipComments: true }],
      "max-params": ["warn", 4],
      complexity: ["warn", 10],
      // `onClick={() => setAbierto(true)}` es la forma habitual en React: no confunde a nadie.
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
    },
  },

  {
    // Un componente con su JSX ocupa más líneas que una función: el aviso salta más tarde.
    files: ["**/*.tsx"],
    rules: {
      "max-lines-per-function": ["warn", { max: 120, skipBlankLines: true, skipComments: true }],
    },
  },

  {
    files: ["navegador/**/*.{ts,tsx}", "compartido/**/*.ts", "servidor/**/*.ts"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": zonas,
      "import/resolver": {
        typescript: {
          project: [
            "./configuracion/tsconfig.navegador.json",
            "./configuracion/tsconfig.servidor.json",
          ],
          noWarnOnMultipleProjects: true,
        },
      },
    },
    rules: {
      "boundaries/dependencies": ["error", { default: "disallow", policies: politicas }],
    },
  },

  {
    files: ["**/*.test.{ts,tsx}"],
    // Los comparadores de Vitest (`expect.any`, `expect.objectContaining`) están tipados como any.
    rules: { "max-lines-per-function": "off", "@typescript-eslint/no-unsafe-assignment": "off" },
  },
);
