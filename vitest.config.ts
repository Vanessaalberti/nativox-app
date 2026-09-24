import { defineConfig } from "vitest/config";
import { alias } from "./vite.config.ts";

export default defineConfig({
  resolve: { alias },
  test: {
    include: ["{navegador,compartido,servidor}/**/*.test.{ts,tsx}"],
  },
});
