import { describe, expect, it } from "vitest";
import { barSubjects, barsOfEdge, expectBarSubject } from "./barSubjects";
import { decode } from "./compare";
import { reference } from "./fixtures";

// The seeded dataset never gives a flat bar, a bar with no range, a high below a low, a gap, a bar with no volume, a
// price near zero, a zero or negative price, a price near the largest double, or a series shorter than the windows.
// These synthetic series of bars reach the guards of the indicators for those cases, and every indicator that reads
// whole bars (the ones ported earlier, ATR, which several build on, and the new ones) is compared with
// Java's on each, with the same tolerance as in the scenarios. They also put one field at a time of one bar to NaN,
// Infinity and -Infinity, in the middle of a series and as its first bar. A value that is not finite is compared as
// what it is: NaN, Infinity and -Infinity are three different results.

const edges = Object.entries(reference.barEdges);
const FIELDS = ["open", "high", "low", "close", "volume"] as const;
const KINDS = [
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["NegInfinity", -Infinity],
] as const;
const capitalized = (field: string): string => field[0].toUpperCase() + field.slice(1);

/** The values of one field of the edge, decoded. */
const field = (edge: (typeof reference.barEdges)[string], name: (typeof FIELDS)[number]): number[] => edge[name].map(decode);

describe("the bar edge inputs", () => {
  it("cover the cases the scenarios do not reach", () => {
    expect(Object.keys(reference.barEdges)).toEqual(
      expect.arrayContaining([
        "rising", "falling", "wave", "flat", "zeroRange", "gaps", "highBelowLow", "zeroVolume", "zeroVolumeStretch", "collapse", "short",
        "smallestPrice", "zeroBar", "zeroFirstBar", "negativePrice", "overflowRange", "nearMax", "nearMaxAlternating",
      ]),
    );
    const { rising, falling, flat, zeroRange, gaps, highBelowLow, zeroVolume, zeroVolumeStretch, collapse, short } = reference.barEdges;
    const closes = (edge: typeof rising) => field(edge, "close");
    expect(closes(rising).every((c, i, all) => i === 0 || c > all[i - 1])).toBe(true);
    expect(closes(falling).every((c, i, all) => i === 0 || c < all[i - 1])).toBe(true);
    for (const name of FIELDS.slice(0, 4)) expect(new Set(field(flat, name)).size, `flat ${name}`).toBe(1);
    expect(field(flat, "high")[0]).toBe(field(flat, "open")[0]);
    const high = field(zeroRange, "high");
    const low = field(zeroRange, "low");
    expect(high.some((h, i) => h === low[i])).toBe(true);
    expect(high.some((h, i) => h > low[i])).toBe(true);
    const invertedHigh = field(highBelowLow, "high");
    const invertedLow = field(highBelowLow, "low");
    expect(invertedHigh.some((h, i) => h < invertedLow[i])).toBe(true);
    expect(invertedHigh.some((h, i) => h > invertedLow[i])).toBe(true);
    const gapCloses = closes(gaps);
    const gapOpens = field(gaps, "open");
    expect(gapOpens.some((o, i) => i > 0 && Math.abs(o - gapCloses[i]) > 20)).toBe(true);
    expect(field(zeroVolume, "volume").every((v) => v === 0)).toBe(true);
    const stretch = field(zeroVolumeStretch, "volume");
    expect(stretch.some((v) => v === 0) && stretch.some((v) => v > 0)).toBe(true);
    expect(Math.min(...closes(collapse))).toBeLessThan(1e-6);
    expect(closes(collapse)[0]).toBeGreaterThan(90);
    expect(closes(short).length).toBeLessThan(8);
    expect(field(reference.barEdges.smallestPrice, "close")).toContain(Number.MIN_VALUE);
    expect(field(reference.barEdges.zeroBar, "close")).toContain(0);
    expect(field(reference.barEdges.negativePrice, "close").some((c) => c < 0)).toBe(true);
    expect(field(reference.barEdges.overflowRange, "high")).toContain(Number.MAX_VALUE);
    expect(field(reference.barEdges.overflowRange, "low")).toContain(-Number.MAX_VALUE);
    expect(Math.max(...closes(reference.barEdges.nearMax))).toBeGreaterThan(1.6e308);
    expect(closes(reference.barEdges.nearMaxAlternating).some((c) => c < -1.6e308)).toBe(true);
  });

  it("put every field in turn to NaN, Infinity and -Infinity, in the middle and as the first bar, and nothing else", () => {
    for (const name of FIELDS) {
      for (const [kind, bad] of KINDS) {
        for (const [prefix, bar] of [["poison", 25], ["poisonFirst", 0]] as const) {
          const edge = reference.barEdges[`${prefix}${capitalized(name)}${kind}`];
          expect(edge, `${prefix}${capitalized(name)}${kind}`).toBeDefined();
          for (const other of FIELDS) {
            const values = field(edge, other);
            const nonFinite = values.map((v, i) => [v, i] as const).filter(([v]) => !Number.isFinite(v));
            if (other === name) {
              expect(nonFinite.length, `${prefix} ${name} ${kind}: ${other}`).toBe(1);
              expect(nonFinite[0][1]).toBe(bar);
              expect(Object.is(nonFinite[0][0], bad)).toBe(true);
              // a string in the fixture, so that the three kinds are told apart
              expect(typeof edge[other][bar]).toBe("string");
            } else {
              expect(nonFinite, `${prefix} ${name} ${kind}: ${other}`).toEqual([]);
            }
          }
        }
      }
    }
    expect(Object.keys(reference.barEdges).filter((name) => name.startsWith("poison"))).toHaveLength(30);
  });

  it("have a series for every bar-fed indicator the fixture lists, and no other", () => {
    for (const [name, edge] of edges) {
      expect(Object.keys(edge.series).sort(), name).toEqual(barSubjects.map((subject) => subject.key).sort());
    }
  });

  it("hold the same number of values in every field", () => {
    for (const [name, edge] of edges) {
      for (const other of FIELDS) expect(edge[other], `${name} ${other}`).toHaveLength(edge.close.length);
    }
  });
});

describe.each(edges)("the %s bar edge", (_, edge) => {
  const bars = barsOfEdge(edge);

  it.each(barSubjects.map((subject) => [subject.label, subject] as const))("%s equals Java's", (_label, subject) => {
    const expected = edge.series[subject.key];
    if ("throws" in expected) {
      expect(() => subject.run(bars), `${subject.key} throws in Java: ${expected.throws}`).toThrow();
    } else {
      expectBarSubject(subject, bars, expected, subject.key);
    }
  });
});
