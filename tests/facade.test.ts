import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { InstrumentGroupRTIndicator, InstrumentMapKlineSourceRTIndicator } from "@qtsurfer/indicators";
import { Pro } from "../src";
import { reference } from "./fixtures";

// Every call of tests/fixtures/facade-calls.txt, run here and by the Java engine's Pro (tools/java-oracle), must
// register the same names with the same display hint and metadata. The Java side is in reference.json.

const calls = readFileSync(new URL("./fixtures/facade-calls.txt", import.meta.url), "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line !== "" && !line.startsWith("#"));

type Arg = string | number | number[];

// A name is in double quotes and an array is in brackets without spaces, like [10,15,20]; the Java side tells an int[]
// from a double[] by the decimal point, which JavaScript does not need
function parse(line: string): { method: string; args: Arg[] } {
  const [method, ...rest] = line.split(/\s+/);
  const arg = (token: string): Arg => {
    if (token.startsWith('"')) return token.slice(1, -1);
    if (token.startsWith("[")) {
      const inner = token.slice(1, -1).trim();
      return inner === "" ? [] : inner.split(",").map(Number);
    }
    return Number(token);
  };
  return { method: method!, args: rest.map(arg) };
}

// JavaScript writes a whole double without its ".0" and a small one as 0.0001, where Java writes 1.0 and 1.0E-4: the
// same number is the same metadata
const normalize = (value: string): string => (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value) ? String(Number(value)) : value);

function registeredBy(line: string): Record<string, { hint: string; meta: Record<string, string> }> {
  const group = new InstrumentGroupRTIndicator(new InstrumentMapKlineSourceRTIndicator("BTC/USDT"));
  const { method, args } = parse(line);
  (Pro.on(group) as unknown as Record<string, (...args: Arg[]) => unknown>)[method]!(...args);
  const registered: Record<string, { hint: string; meta: Record<string, string> }> = {};
  group.indicators.forEachPublicable((name, indicator) => {
    registered[name] = {
      hint: String(indicator.getDisplayHint!()),
      meta: Object.fromEntries([...indicator.getMeta!().asMap()].map(([key, value]) => [key, normalize(value)])),
    };
  });
  return registered;
}

describe("Pro registers what the Java engine's Pro registers", () => {
  it("has a Java reference for every call, and only for them", () => {
    expect(Object.keys(reference.facade).sort()).toEqual([...calls].sort());
  });

  for (const line of calls) {
    const expected = reference.facade[line];
    // a factory the Java build does not have yet is not compared: the oracle records that it is missing
    const run = expected !== undefined && "missing" in expected ? it.skip : it;
    run(`${line}${expected !== undefined && "missing" in expected ? " (not in the Java build)" : ""}`, () => {
      if (expected === undefined) throw new Error("no Java reference: run `pnpm oracle`");
      if ("throws" in expected) {
        expect(() => registeredBy(line)).toThrow();
      } else if ("registered" in expected) {
        const java = Object.fromEntries(
          Object.entries(expected.registered).map(([name, entry]) => [
            name,
            { hint: entry.hint, meta: Object.fromEntries(Object.entries(entry.meta).map(([k, v]) => [k, normalize(v)])) },
          ]),
        );
        expect(registeredBy(line)).toEqual(java);
      }
    });
  }
});
