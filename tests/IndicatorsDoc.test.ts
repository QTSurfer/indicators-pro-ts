// indicators.md names every indicator class of the package, and each row says what the facade really registers.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { InstrumentGroupRTIndicator, InstrumentMapKlineSourceRTIndicator, type RTIndicator } from "@qtsurfer/indicators";
import { describe, expect, it } from "vitest";
import * as exported from "../src";
import { Pro } from "../src";

const root = path.resolve(__dirname, "..");
const md = readFileSync(path.join(root, "indicators.md"), "utf8");
const src = path.join(root, "src");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    return statSync(file).isDirectory() ? sources(file) : file.endsWith(".ts") ? [file] : [];
  });
}

const text = sources(src).map((file) => readFileSync(file, "utf8"));
const concrete = text.flatMap((t) => [...t.matchAll(/^export class ([A-Za-z]+RTIndicator)\b/gm)].map((m) => m[1]!));
// the public factories of Pro: the methods `name(...): this` of src/pro/Pro.ts (private ones start with `private`)
const factories = new Set(
  [...readFileSync(path.join(src, "pro", "Pro.ts"), "utf8").matchAll(/^  ([a-z][A-Za-z]*)\(.*\): this(?:;| \{)$/gm)].map((m) => m[1]!),
);

interface Row {
  className: string;
  /** The `Pro` method of the Call column, or null when the class has no factory yet (`—`). */
  method: string | null;
  args: number[];
  id: string;
  outputs: string[];
  bars: boolean;
}

const rows: Row[] = md
  .split("\n")
  .filter((line) => line.startsWith("| "))
  .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
  .filter((cells) => cells.length === 7 && /^`[A-Za-z]+RTIndicator`$/.test(cells[1]!))
  .map((cells) => {
    const call = cells[2] === "—" ? null : /^`([a-z][A-Za-z]*)\(([0-9., ]*)\)`$/.exec(cells[2]!);
    if (cells[2] !== "—" && !call) throw new Error(`indicators.md: not a call of Pro: ${cells[2]}`);
    return {
      className: cells[1]!.slice(1, -1),
      method: call ? call[1]! : null,
      args: call ? call[2]!.split(",").filter((a) => a.trim() !== "").map(Number) : [],
      id: cells[3]!.replace(/`/g, ""),
      outputs: [...cells[4]!.matchAll(/`([A-Z][A-Za-z]*)`/g)].map((m) => m[1]!),
      bars: cells[5] === "yes",
    };
  });

// the rows that have a factory: the others are classes without a `Pro` call yet
const called = rows.filter((row) => row.method !== null);

function register(row: Row): InstrumentGroupRTIndicator {
  const group = new InstrumentGroupRTIndicator(new InstrumentMapKlineSourceRTIndicator("BTC/USDT"));
  (Pro.on(group) as unknown as Record<string, (...args: number[]) => unknown>)[row.method!]!(...row.args);
  return group;
}

describe("indicators.md", () => {
  it("has one row for each concrete indicator class of the package, and no other", () => {
    expect(rows.map((row) => row.className).sort()).toEqual([...concrete].sort());
  });

  it("calls every factory of Pro and only factories that exist", () => {
    expect(factories.size).toBeGreaterThan(10);
    expect([...new Set(called.map((row) => row.method))].sort()).toEqual([...factories].sort());
  });

  it.each(called.map((row) => [row.className, row] as const))("%s: the call registers the id and the outputs it lists", (_, row) => {
    const group = register(row);
    const main = group.get(row.id);
    expect(main, row.id).toBeInstanceOf((exported as Record<string, unknown>)[row.className] as new (...args: never[]) => RTIndicator);
    for (const suffix of row.outputs) {
      expect(group.get(row.id + suffix), row.id + suffix).toBeDefined();
    }
  });

  it.each(called.map((row) => [row.className, row] as const))("%s: the bar flag is what the class declares", (_, row) => {
    const main = register(row).getExisting(row.id) as RTIndicator & { requiresBarData?: () => boolean };
    expect(main.requiresBarData?.() === true).toBe(row.bars);
  });

  it("lists every output suffix of Pro", () => {
    const declared = Object.entries(Pro)
      .filter(([key]) => key.startsWith("SUFFIX_"))
      .map(([, value]) => value as string)
      .sort();
    expect([...new Set(called.flatMap((row) => row.outputs))].sort()).toEqual(declared);
  });
});
