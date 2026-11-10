import { defineConfig } from "vitest/config";
import path from "path";

const src = path.resolve(__dirname, "src");

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"] },
  resolve: {
    alias: {
      $averages: `${src}/averages`,
      $core: `${src}/core`,
      $momentum: `${src}/momentum`,
      $pro: `${src}/pro`,
      $statistics: `${src}/statistics`,
      $trend: `${src}/trend`,
      $volatility: `${src}/volatility`,
      $volume: `${src}/volume`,
    },
  },
});
