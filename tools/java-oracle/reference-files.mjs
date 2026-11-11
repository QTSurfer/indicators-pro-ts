// How the values of the Java engine are kept in the repository: tests/fixtures/reference/ holds the document the
// oracle writes (Oracle.java), split by area into gzip files so that a rewrite adds little to the history. Nobody
// edits these files by hand, and `tests/fixtures.ts` merges them back into the one document.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

/** The file for each group of top-level keys of the document. Every key lands in exactly one file. */
export const PARTS = {
  "base.json.gz": ["bars", "inputs", "poisons"],
  "scenarios.json.gz": ["scenarios"],
  "edges.json.gz": ["edges"],
  "barEdges.json.gz": ["barEdges"],
  "facade.json.gz": ["facade"],
};

// JSON.stringify writes -0 as 0. The tests compare with Object.is, so the sign of a zero must survive: it is put
// in as a marker string and then replaced by a -0 literal, which JSON.parse reads back as -0.
const NEGATIVE_ZERO = "\u0000-0\u0000";

function encode(part) {
  const marker = JSON.stringify(NEGATIVE_ZERO);
  return JSON.stringify(part, (_key, value) => (Object.is(value, -0) ? NEGATIVE_ZERO : value)).replaceAll(marker, "-0");
}

/** The path of the first leaf where two parsed documents differ (`Object.is` on leaves), or null when they are the same. */
function firstDifference(a, b, path = "") {
  const aNode = typeof a === "object" && a !== null;
  const bNode = typeof b === "object" && b !== null;
  if (!aNode || !bNode) return aNode === bNode && Object.is(a, b) ? null : path || "(root)";
  if (Array.isArray(a) !== Array.isArray(b)) return path || "(root)";
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return `${path}.length`;
  for (const key of aKeys) {
    if (!Object.hasOwn(b, key)) return `${path}.${key}`;
    const found = firstDifference(a[key], b[key], `${path}.${key}`);
    if (found !== null) return found;
  }
  return null;
}

/**
 * The files for a document: file name to gzip bytes. The same document always gives the same bytes. It throws on a
 * top-level key that no file takes, on a key that is missing, and on a value that JSON would not keep as it is (a
 * number that is not finite becomes null), before anything is written.
 */
export function splitReference(document) {
  if (typeof document !== "object" || document === null || Array.isArray(document)) {
    throw new Error("the oracle must write one JSON object");
  }
  const known = new Set(Object.values(PARTS).flat());
  const unknown = Object.keys(document).filter((key) => !known.has(key));
  if (unknown.length > 0) {
    throw new Error(`the oracle wrote top-level keys that no reference file takes: ${unknown.join(", ")}; add them to PARTS`);
  }
  const files = {};
  for (const [file, keys] of Object.entries(PARTS)) {
    const part = {};
    for (const key of keys) {
      if (!Object.hasOwn(document, key)) throw new Error(`the oracle did not write the top-level key ${key}`);
      part[key] = document[key];
    }
    const text = encode(part);
    const difference = firstDifference(part, JSON.parse(text));
    if (difference !== null) throw new Error(`${file} would not keep the value at ${difference} as the oracle wrote it`);
    files[file] = gzipSync(Buffer.from(text, "utf8"), { level: 9 });
  }
  return files;
}

function sameText(path, bytes) {
  try {
    return gunzipSync(readFileSync(path)).equals(gunzipSync(bytes));
  } catch {
    return false;
  }
}

/**
 * Writes the files of a document into `directory`. A file whose text did not change is left as it is, so another
 * build of zlib cannot turn a rewrite that changed nothing into a new binary in the history. Files of a former
 * layout (`*.json.gz` that no part names) are removed.
 */
export function writeReference(directory, document) {
  const files = splitReference(document);
  mkdirSync(directory, { recursive: true });
  const written = [];
  for (const [file, bytes] of Object.entries(files)) {
    const path = join(directory, file);
    if (sameText(path, bytes)) continue;
    writeFileSync(path, bytes);
    written.push(file);
  }
  for (const file of readdirSync(directory)) {
    if (file.endsWith(".json.gz") && !Object.hasOwn(PARTS, file)) rmSync(join(directory, file));
  }
  return written;
}
