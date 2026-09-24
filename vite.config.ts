import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const rutaAbsoluta = (ruta: string) => fileURLToPath(new URL(ruta, import.meta.url));

// Los mismos alias que tsconfig.base.json; también los usa vitest.config.ts.
export const alias = {
  "@navegador": rutaAbsoluta("./navegador"),
  "@compartido": rutaAbsoluta("./compartido"),
  "@servidor": rutaAbsoluta("./servidor"),
};

// En desarrollo Vite sirve el HTML sin leer publico/_headers: se replica acá la misma regla
// (aislamiento entre orígenes solo en las páginas que corren modelos).
const rutasConModelos = /^\/sala\/[^/]+\/control\/?$/;

const aislamientoEnDesarrollo: Plugin = {
  name: "nativox:aislamiento-en-desarrollo",
  configureServer(servidor) {
    servidor.middlewares.use((pedido, respuesta, seguir) => {
      const ruta = new URL(pedido.url ?? "/", "http://localhost").pathname;
      if (rutasConModelos.test(ruta)) {
        respuesta.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        respuesta.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
      }
      seguir();
    });
  },
};

export default defineConfig({
  publicDir: "publico",
  resolve: { alias },
  // Sin bindings remotos, `npm run dev` funciona sin internet y sin cuenta de Cloudflare (local
  // primero). Workers AI es opcional y se prueba en la versión desplegada.
  plugins: [aislamientoEnDesarrollo, react(), cloudflare({ remoteBindings: false })],
});
