#!/usr/bin/env node
// Rewrites the gzip files of tests/fixtures/reference/ from the Java engine: the values every ported indicator must give.
//
//   QTS_JAVA_ENGINE=/path/to/java-engine node tools/java-oracle/regenerate.mjs
//
// The Java engine checkout is built as it stands (mvn test-compile in its pro module), uncommitted
// changes included, and its test classpath runs Oracle.java. The oracle writes one JSON document to a temporary
// file, which is deleted afterwards; reference-files.mjs splits it into the files of the repository.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeReference } from "./reference-files.mjs";

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
const scratch = mkdtempSync(join(tmpdir(), "indicators-pro-oracle-"));
process.on("exit", () => rmSync(scratch, { recursive: true, force: true }));
const document = join(scratch, "oracle-output.json");
run("java", ["-cp", classpath, join(here, "Oracle.java"), document, join(root, "tests/fixtures/facade-calls.txt")], root);
const directory = join(root, "tests/fixtures/reference");
const written = writeReference(directory, JSON.parse(readFileSync(document, "utf8")));
console.error(written.length === 0 ? `${directory} is up to date` : `wrote ${written.join(", ")} in ${directory}`);
