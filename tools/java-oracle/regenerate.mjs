#!/usr/bin/env node
// Rewrites tests/fixtures/reference.json from the Java engine: the values every ported indicator must give.
//
//   QTS_JAVA_ENGINE=/path/to/java-engine node tools/java-oracle/regenerate.mjs
//
// The Java engine checkout is built as it stands (mvn test-compile in its pro module), uncommitted
// changes included, and its test classpath runs Oracle.java.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const engine = resolve(process.env.INIT_CWD ?? process.cwd(), process.env.QTS_JAVA_ENGINE ?? "");
if (!process.env.QTS_JAVA_ENGINE) {
  console.error("QTS_JAVA_ENGINE must name a checkout of the Java engine");
  process.exit(2);
}
const pro = join(engine, "qtsurfer-engine-indicators-pro");
const classpathFile = join(root, "tools/java-oracle/classpath.txt");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    process.stderr.write(result.stdout + result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

console.error(`building ${engine}`);
run(
  "mvn",
  ["-q", "-pl", "qtsurfer-engine-indicators-pro", "-am", "test-compile", "dependency:build-classpath",
    `-Dmdep.outputFile=${classpathFile}`, "-Dmdep.includeScope=test", "-DskipTests", "-Djacoco.skip=true",
    "-Dspotless.check.skip=true"],
  engine,
);
const classpath = [join(pro, "target/test-classes"), join(pro, "target/classes"), readFileSync(classpathFile, "utf8").trim()].join(delimiter);
mkdirSync(join(root, "tests/fixtures"), { recursive: true });
const out = join(root, "tests/fixtures/reference.json");
run("java", ["-cp", classpath, join(here, "Oracle.java"), out], root);
console.error(`wrote ${out}`);
