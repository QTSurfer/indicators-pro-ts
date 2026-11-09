#!/usr/bin/env node
// The published package carries the licence files of the repository in its tarball and declares the
// licence. npm puts LICENSE in a tarball by itself; the other two files are listed in `files`.
// Run by `pnpm test`.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const LICENSE = "AGPL-3.0-only OR LicenseRef-Wualabs-Commercial";
const LISTED = ["LICENSING.md", "STRATEGY-EXCEPTION.md"];

const problems = [];
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (pkg.license !== LICENSE) problems.push(`package.json: license is ${JSON.stringify(pkg.license)}`);
for (const file of ["LICENSE", "CLA.md", ...LISTED]) {
  if (!existsSync(join(root, file))) problems.push(`${file} is missing`);
}
for (const file of LISTED) {
  if (!(pkg.files ?? []).includes(file)) problems.push(`package.json: "files" does not list ${file}`);
}

if (problems.length > 0) {
  console.error("Licence files out of step:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
console.log("licence files: the package carries them");
