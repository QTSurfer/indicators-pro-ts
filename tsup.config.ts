import { defineConfig } from "tsup";
import path from "path";

const src = path.resolve("src");

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  tsconfig: "tsconfig.json",
  esbuildOptions(options) {
    // getId() derives an indicator's type from its class name: the bundle must not rename classes
    options.keepNames = true;
    options.alias = {
      $averages: `${src}/averages`,
      $core: `${src}/core`,
      $momentum: `${src}/momentum`,
      $pro: `${src}/pro`,
      $statistics: `${src}/statistics`,
      $trend: `${src}/trend`,
      $volume: `${src}/volume`,
    };
  },
});
