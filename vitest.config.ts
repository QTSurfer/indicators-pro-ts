import { defineConfig } from "vitest/config";
import path from "path";

const src = path.resolve(__dirname, "src");

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"] },
  resolve: {
    alias: {
      $core: `${src}/core`,
      $pro: `${src}/pro`,
      $statistics: `${src}/statistics`,
      $trend: `${src}/trend`,
      $volume: `${src}/volume`,
    },
  },
});
