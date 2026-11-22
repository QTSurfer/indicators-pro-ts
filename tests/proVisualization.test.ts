import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DisplayHint, InstrumentGroupRTIndicator, InstrumentMapKlineSourceRTIndicator } from "@qtsurfer/indicators";
import { Pro } from "../src";
import { ProVisualization } from "../src/pro/ProVisualization";

// The visualization metadata of every pro factory against the table the web team keeps for the charts, copied to
// tests/viz/pro-visualization.tsv. The engine is the source of truth: when the two differ, the row is reviewed, not
// silently copied in either direction.

/**
 * Rows where the engine keeps the display hint it has always told (a percentage) and the table proposes an index.
 * Changing a hint that stored columns and charts already read is a separate, announced step; until then the table's
 * `I` is read as `P` for these.
 */
const KEPT_AS_PERCENT = new Set([
  "adx",
  "aroon",
  "choppinessIndex",
  "mfi",
  "relativeVolatilityIndex",
  "stochasticOscillator",
  "ultimateOscillator",
  "williamsR",
]);

interface Row {
  id: string;
  name: string;
  dsp: string;
  plc: string;
  rng: string;
  flo: string;
  lvl: string;
  outputs: string;
}

const rows: Row[] = readFileSync(new URL("./viz/pro-visualization.tsv", import.meta.url), "utf8")
  .split("\n")
  .filter((line) => line.trim() !== "" && !line.startsWith("#"))
  .map((line) => {
    const [id, name, dsp, plc, rng, flo, lvl, outputs] = line.split("\t");
    return { id: id!, name: name!, dsp: dsp!, plc: plc!, rng: rng!, flo: flo!, lvl: lvl!, outputs: outputs! };
  });

/**
 * A group with the factory `id` registered under its default name. The factories that need a period get 20 and a
 * percentile 0.95, which are the defaults the table names (`alma20`, `pctl20_0.95`): the shortest list of arguments
 * that registers the name of the row is the form with default naming.
 */
function build(row: Row): InstrumentGroupRTIndicator {
  const candidates: number[][] = [[], [20], [20, 0.95], [20, 20], [20, 20, 20]];
  for (const args of candidates) {
    const group = new InstrumentGroupRTIndicator(new InstrumentMapKlineSourceRTIndicator("BTC/USDT"));
    try {
      (Pro.on(group) as unknown as Record<string, (...a: number[]) => unknown>)[row.id]!(...args);
    } catch {
      continue;
    }
    if (group.get(row.name) !== undefined) {
      return group;
    }
  }
  throw new Error(`no factory ${row.id} with default naming registers ${row.name}`);
}

const keyOrUndefined = (column: string): string | undefined => (column === "-" ? undefined : column);

function expectedDsp(row: Row): string | undefined {
  return keyOrUndefined(KEPT_AS_PERCENT.has(row.id) ? "P" : row.dsp);
}

function flag(flags: string, key: string): string | undefined {
  return flags
    .split(" ")
    .find((token) => token.startsWith(key))
    ?.slice(key.length);
}

describe("the visualization metadata of every pro factory, against the table", () => {
  it("every factory describes itself as the table says", () => {
    for (const row of rows) {
      const group = build(row);
      row.outputs.split(" | ").forEach((output, i) => {
        const token = output.trim();
        const head = token.split(" ")[0]!;
        const flags = token.slice(head.length).trim();
        const main = i === 0;
        const suffix = main ? "" : head;
        const where = row.id + (main ? "" : `.${suffix}`);
        const indicator = group.get(row.name + suffix);
        expect(indicator, `${where} registered as ${row.name + suffix}`).toBeDefined();
        const meta = indicator!.getMeta!();
        if (main || flag(flags, "drw=") !== "0") {
          expect(meta.get("dsp"), `${where} dsp`).toBe(expectedDsp(row));
          expect(meta.get("plc"), `${where} plc`).toBe(keyOrUndefined(row.plc));
          expect(meta.get("rng"), `${where} rng`).toBe(keyOrUndefined(row.rng));
          expect(meta.get("flo"), `${where} flo`).toBe(keyOrUndefined(row.flo));
          expect(meta.get("lvl"), `${where} lvl`).toBe(keyOrUndefined(row.lvl));
        } else {
          expect(meta.get("dsp"), `${where} carries no unit when not drawn`).toBeUndefined();
          expect(meta.get("rng"), `${where} carries no range when not drawn`).toBeUndefined();
        }
        expect(meta.get("sty"), `${where} sty`).toBe(flag(flags, "sty="));
        expect(meta.get("sde"), `${where} sde`).toBe(flag(flags, "sde="));
        expect(meta.get("drw"), `${where} drw`).toBe(flag(flags, "drw="));
        expect(meta.get("band"), `${where} band`).toBe(flags.includes("bnd") ? suffix.toLowerCase() : undefined);
      });
    }
  });

  it("the table and the engine name the same factories", () => {
    const inTable = new Set(rows.map((row) => row.id));
    expect(inTable.size).toBe(rows.length);
    expect([...ProVisualization.ids()].sort()).toEqual([...inTable].sort());
    for (const row of rows) {
      expect(() => build(row), row.id).not.toThrow();
    }
  });

  it("a display hint the engine always told is never quietly changed", () => {
    for (const row of rows.filter((r) => KEPT_AS_PERCENT.has(r.id))) {
      expect(build(row).get(row.name)!.getDisplayHint!(), row.id).toBe(DisplayHint.PERCENT);
    }
  });
});
