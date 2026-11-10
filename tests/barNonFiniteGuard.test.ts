import type { Kline, Ticker } from "@qtsurfer/core";
import type { AbstractRTIndicator } from "@qtsurfer/indicators";
import { describe, expect, it } from "vitest";
import { AroonRTIndicator } from "$trend/AroonRTIndicator";
import { ChandeKrollStopRTIndicator } from "$trend/ChandeKrollStopRTIndicator";
import { ChandelierExitRTIndicator } from "$trend/ChandelierExitRTIndicator";
import { DonchianChannelRTIndicator } from "$trend/DonchianChannelRTIndicator";
import { EfficiencyRatioRTIndicator } from "$trend/EfficiencyRatioRTIndicator";
import { ParabolicSarRTIndicator } from "$trend/ParabolicSarRTIndicator";
import { SuperTrendRTIndicator } from "$trend/SuperTrendRTIndicator";
import { VortexRTIndicator } from "$trend/VortexRTIndicator";
import { ChoppinessIndexRTIndicator } from "$volatility/ChoppinessIndexRTIndicator";
import { KeltnerChannelRTIndicator } from "$volatility/KeltnerChannelRTIndicator";
import { MassIndexRTIndicator } from "$volatility/MassIndexRTIndicator";
import { NatrRTIndicator } from "$volatility/NatrRTIndicator";
import { RelativeVolatilityIndexRTIndicator } from "$volatility/RelativeVolatilityIndexRTIndicator";

// A bar with a field that is not finite (NaN, Infinity, -Infinity) in a field the class reads is ignored by the ten new
// bar-fed indicators (and by SuperTrend), as it is by the Java engine's: nothing is updated (no window, inner indicator, counter, running
// sum or flag), the value it held is kept, and so is every other getter. A field the class does not read is never
// looked at. The property: an instance fed a series with such bars put in anywhere behaves, from then on and at every
// later step, exactly like one fed the same series without them, bit for bit. The scalar `update` is guarded the same
// way, and so are the two indicators that read the price. The derived holds (a value worked out from finite fields
// that overflows) are in barDerivedHolds.test.ts.

type Field = "open" | "high" | "low" | "close" | "volume";
const FIELDS: readonly Field[] = ["open", "high", "low", "close", "volume"];
const SERIES_LENGTH = 240;
const BAD = [
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["-Infinity", -Infinity],
] as const;

type BarIndicator = AbstractRTIndicator & { updateFrom(bar: Kline): void };

interface BarCase {
  name: string;
  make: () => BarIndicator;
  /** The fields the class reads: a bar with one of them not finite is left out. */
  reads: readonly Field[];
  /** The getters besides the value. */
  parts: (indicator: BarIndicator) => number[];
}

function bar<T extends BarIndicator>(
  name: string,
  reads: readonly Field[],
  make: () => T,
  parts: (indicator: T) => number[] = () => [],
): BarCase {
  return { name, reads, make, parts: parts as (indicator: BarIndicator) => number[] };
}

const HL: readonly Field[] = ["high", "low"];
const HLC: readonly Field[] = ["high", "low", "close"];

/** The ten classes, with parameters short enough to warm up well inside the series. */
const bars: BarCase[] = [
  bar("Aroon", HL, () => new AroonRTIndicator(10), (i) => [i.getAroonUp(), i.getAroonDown()]),
  bar("ChandeKrollStop", HLC, () => new ChandeKrollStopRTIndicator(5, 1.5, 4, 3), (i) => [i.getStopLong(), i.getStopShort()]),
  bar("ChandelierExit", HLC, () => new ChandelierExitRTIndicator(8, 2.5), (i) => [i.getLongExit(), i.getShortExit()]),
  bar("DonchianChannel", HL, () => new DonchianChannelRTIndicator(8), (i) => [i.getUpper(), i.getLower(), i.getMiddle()]),
  bar("ParabolicSar", HL, () => new ParabolicSarRTIndicator(), (i) => [i.isUpTrend() ? 1 : 0]),
  bar("Vortex", HLC, () => new VortexRTIndicator(8), (i) => [i.getVIPlus(), i.getVIMinus()]),
  bar("ChoppinessIndex", HLC, () => new ChoppinessIndexRTIndicator(8)),
  bar("KeltnerChannel", HLC, () => new KeltnerChannelRTIndicator(6, 4, 2.0), (i) => [i.getUpper(), i.getLower(), i.getMiddle()]),
  bar("MassIndex", HL, () => new MassIndexRTIndicator(10, 4)),
  bar("Natr", HLC, () => new NatrRTIndicator(8)),
  // an older class that reads the same three fields
  bar("SuperTrend", HLC, () => new SuperTrendRTIndicator(6, 2.0), (i) => [i.getUpperBand(), i.getLowerBand(), i.isUpTrend() ? 1 : 0]),
];

/** Deterministic, positive, not trivial: a trend, two cycles, a sawtooth, and flat bars. */
function barSeries(): Kline[] {
  const out: Kline[] = [];
  let previous = 100;
  for (let i = 0; i < SERIES_LENGTH; i++) {
    let close = 100 + 20 * Math.sin(i * 0.17) + 5 * Math.cos(i * 0.9) + (i % 11) * 0.25 + i * 0.05;
    let open = previous;
    let high = Math.max(open, close) + 0.3 + 0.2 * Math.abs(Math.sin(i * 1.7));
    let low = Math.min(open, close) - 0.3 - 0.2 * Math.abs(Math.cos(i * 2.3));
    if (i % 13 === 12) {
      // a flat bar: no range, and no change from the bar before
      close = open = high = low = previous;
    }
    out.push({
      instrument: "BTC/USDT",
      open,
      high,
      low,
      close,
      volume: 1000 + 50 * Math.sin(i),
      quoteVolume: 1000 * close,
      numberOfTrades: 5,
      timestamp: i * 60_000 + 59_999,
    });
    previous = close;
  }
  return out;
}

/** A plausible bar with one field not finite: the bar `like`, with `field` replaced. */
function withField(like: Kline, field: Field, value: number): Kline {
  return { ...like, [field]: value };
}

function isLeftOut(c: BarCase, kline: Kline): boolean {
  return c.reads.some((field) => !Number.isFinite(kline[field]));
}

function sameBits(actual: number, expected: number, what: string): void {
  expect(Object.is(actual, expected), `${what}: ${actual} against ${expected}`).toBe(true);
}

function sameState(c: BarCase, dirty: BarIndicator, clean: BarIndicator, where: string): void {
  sameBits(dirty.getValue(), clean.getValue(), `${c.name} getValue ${where}`);
  expect(dirty.isReady(), `${c.name} isReady ${where}`).toBe(clean.isReady());
  const dirtyParts = c.parts(dirty);
  const cleanParts = c.parts(clean);
  expect(dirtyParts, `${c.name} getters ${where}`).toHaveLength(cleanParts.length);
  for (let p = 0; p < dirtyParts.length; p++) sameBits(dirtyParts[p], cleanParts[p], `${c.name} getter ${p} ${where}`);
}

/** The index in the clean series of the bar after which the instance is ready. */
function warmUpIndex(c: BarCase, clean: readonly Kline[]): number {
  const indicator = c.make();
  for (let k = 0; k < clean.length; k++) {
    indicator.updateFrom(clean[k]);
    if (indicator.isReady()) return k;
  }
  throw new Error(`${c.name} never becomes ready on the test series`);
}

/** The group put before the clean bars at `positions`; a position equal to the length appends. */
function insertAt<T>(clean: readonly T[], positions: Iterable<number>, group: readonly T[]): T[] {
  const at = new Set(positions);
  const out: T[] = [];
  for (let k = 0; k <= clean.length; k++) {
    if (at.has(k)) out.push(...group);
    if (k < clean.length) out.push(clean[k]);
  }
  return out;
}

function positions(warm: number, length: number): number[] {
  // the start, a hundred bars in, the end, and the bars around the one that makes the instance ready
  return [...new Set([0, 1, 100, 199, length, Math.max(0, warm - 1), warm, warm + 1])].filter((p) => p <= length);
}

/**
 * Feeds the dirty series to one instance and the clean one to another, and checks after every bar that they are in the
 * same state: a bar that is left out must not change anything, and the bars after it must give what they would give
 * with no bar left out.
 */
function runAndCompare(c: BarCase, clean: readonly Kline[], dirtySeries: readonly Kline[]): void {
  const cleanInstance = c.make();
  const dirtyInstance = c.make();
  let consumed = 0; // the bars of the clean series taken so far
  for (let step = 0; step < dirtySeries.length; step++) {
    const kline = dirtySeries[step];
    const where = `(step ${step}, ${FIELDS.map((f) => `${f} ${kline[f]}`).join(", ")})`;
    const before = dirtyInstance.getValue();
    dirtyInstance.updateFrom(kline);
    if (isLeftOut(c, kline)) {
      sameBits(dirtyInstance.getValue(), before, `${c.name} value kept on a bar that is left out ${where}`);
    } else {
      cleanInstance.updateFrom(clean[consumed++]);
    }
    sameState(c, dirtyInstance, cleanInstance, where);
    if (dirtyInstance.isReady()) {
      expect(Number.isFinite(dirtyInstance.getValue()), `${c.name} finite once warm ${where}`).toBe(true);
      for (const part of c.parts(dirtyInstance)) expect(Number.isFinite(part), `${c.name} getter finite once warm ${where}`).toBe(true);
    }
  }
  expect(consumed, "every clean bar was taken").toBe(clean.length);
}

describe("a bar with a field it reads that is not finite", () => {
  it("is left out by the 11 classes of the registry, and by no other", () => {
    expect(bars).toHaveLength(11);
    expect(new Set(bars.map((c) => c.name)).size).toBe(11);
  });

  const cases = bars.flatMap((c) => c.reads.flatMap((field) => BAD.map(([label, bad]) => [c.name, field, label, c, bad] as const)));

  describe.each(cases)("%s with %s %s put in", (_name, field, _label, c, bad) => {
    it("behaves like the series without the bar, at every later step", () => {
      const clean = barSeries();
      const warm = warmUpIndex(c, clean);
      const dirty = insertAt(clean, positions(warm, clean.length), [withField(clean[Math.min(warm, clean.length - 1)], field, bad)]);
      expect(dirty.length).toBeGreaterThan(clean.length);
      runAndCompare(c, clean, dirty);
    });
  });

  it.each(bars.map((c) => [c.name, c] as const))("%s: a burst of bars with every kind of field it reads that is not finite behaves like no bars at all", (_, c) => {
    const clean = barSeries();
    const burst: Kline[] = [];
    for (const field of c.reads) for (const [, bad] of BAD) burst.push(withField(clean[7], field, bad));
    // every field of one bar at once, too
    burst.push({ ...clean[7], open: NaN, high: Infinity, low: -Infinity, close: NaN, volume: Infinity });
    const dirty = insertAt(clean, [0, 7, warmUpIndex(c, clean), 120], burst);
    runAndCompare(c, clean, dirty);
  });

  it.each(bars.map((c) => [c.name, c] as const))("%s: a first bar that is not finite leaves it as freshly built", (_, c) => {
    const clean = barSeries();
    for (const field of c.reads) {
      for (const [label, bad] of BAD) {
        const fresh = c.make();
        const touched = c.make();
        touched.updateFrom(withField(clean[0], field, bad));
        sameState(c, touched, fresh, `after a first bar with ${field} ${label}`);
        expect(touched.isReady()).toBe(false);
        expect(touched.getValue()).toBe(0);
        // and what follows is what a new instance gives
        for (const kline of clean.slice(0, 60)) {
          touched.updateFrom(kline);
          fresh.updateFrom(kline);
          sameState(c, touched, fresh, `after a first bar with ${field} ${label}, then the series`);
        }
      }
    }
  });

  it.each(bars.map((c) => [c.name, c] as const))("%s: the getters other than the value keep their values across a bar that is left out", (_, c) => {
    const indicator = c.make();
    const clean = barSeries();
    for (const kline of clean.slice(0, 100)) indicator.updateFrom(kline);
    const value = indicator.getValue();
    const ready = indicator.isReady();
    const parts = c.parts(indicator);
    for (const field of c.reads) {
      for (const [label, bad] of BAD) {
        indicator.updateFrom(withField(clean[100], field, bad));
        sameBits(indicator.getValue(), value, `${c.name} value after ${field} ${label}`);
        expect(indicator.isReady()).toBe(ready);
        const after = c.parts(indicator);
        for (let p = 0; p < parts.length; p++) sameBits(after[p], parts[p], `${c.name} getter ${p} after ${field} ${label}`);
      }
    }
  });

  it.each(bars.map((c) => [c.name, c] as const))("%s: a ticker with no high, low or last price is left out too", (_, c) => {
    const indicator = c.make();
    const fresh = c.make();
    const clean = barSeries();
    for (const kline of clean.slice(0, 40)) {
      indicator.updateFrom(kline);
      fresh.updateFrom(kline);
    }
    const ticker = (missing: "high" | "low" | "last"): Ticker => ({
      instrument: "BTC/USDT",
      open: 100,
      high: missing === "high" ? null : 101,
      low: missing === "low" ? null : 99,
      last: missing === "last" ? null : 100.5,
      bid: null,
      bidSize: null,
      ask: null,
      askSize: null,
      volume: 1000,
      quoteVolume: null,
      vwap: null,
      percentageChange: null,
      timestamp: 1,
    });
    for (const missing of ["high", "low", "last"] as const) {
      const reads = missing === "last" ? c.reads.includes("close") : c.reads.includes(missing);
      if (reads) {
        indicator.updateFrom(ticker(missing) as unknown as Kline);
        sameState(c, indicator, fresh, `after a ticker with no ${missing}`);
      }
    }
  });
});

describe("a field the class does not read", () => {
  const cases = bars.flatMap((c) => FIELDS.filter((field) => !c.reads.includes(field)).map((field) => [c.name, field, c] as const));

  it("is not looked at: the open and the volume by all, the close by the four that read the high and the low only", () => {
    expect(cases.filter(([, field]) => field === "open")).toHaveLength(11);
    expect(cases.filter(([, field]) => field === "volume")).toHaveLength(11);
    expect(cases.filter(([, field]) => field === "close").map(([name]) => name)).toEqual(["Aroon", "DonchianChannel", "ParabolicSar", "MassIndex"]);
    expect(cases.filter(([, field]) => field === "high" || field === "low")).toEqual([]);
  });

  it.each(cases)("%s: a bar with %s not finite is a bar like any other", (_name, field, c) => {
    const clean = barSeries();
    for (const [label, bad] of BAD) {
      // every bar has the field not finite, so the instance must give what it gives on the clean series
      const dirty = clean.map((kline) => withField(kline, field, bad));
      const cleanInstance = c.make();
      const dirtyInstance = c.make();
      for (let k = 0; k < clean.length; k++) {
        cleanInstance.updateFrom(clean[k]);
        dirtyInstance.updateFrom(dirty[k]);
        sameState(c, dirtyInstance, cleanInstance, `(bar ${k}, ${field} ${label})`);
      }
    }
  });
});

describe("a value that is not finite given to the scalar update", () => {
  const priceCases: { name: string; make: () => AbstractRTIndicator; parts: (indicator: AbstractRTIndicator) => number[] }[] = [
    ...bars.map((c) => ({ name: c.name, make: c.make as () => AbstractRTIndicator, parts: c.parts as (indicator: AbstractRTIndicator) => number[] })),
    {
      name: "EfficiencyRatio",
      make: () => new EfficiencyRatioRTIndicator(6),
      parts: (i) => [(i as EfficiencyRatioRTIndicator).getDirection(), (i as EfficiencyRatioRTIndicator).getVolatility()],
    },
    { name: "RelativeVolatilityIndex", make: () => new RelativeVolatilityIndexRTIndicator(5, 4), parts: () => [] },
  ];

  /** A positive price series: the scalar path takes the price as every field of the bar. */
  function prices(): number[] {
    return barSeries().map((kline) => kline.close);
  }

  it("is held by the 11 bar classes and the 2 price classes", () => {
    expect(priceCases).toHaveLength(13);
  });

  describe.each(priceCases.flatMap((c) => BAD.map(([label, bad]) => [c.name, label, c, bad] as const)))("%s with %s put in", (_name, _label, c, bad) => {
    it("behaves like the series without it, at every later step", () => {
      const clean = prices();
      const probe = c.make();
      let warm = -1;
      for (let k = 0; k < clean.length && warm < 0; k++) {
        probe.update(clean[k]);
        if (probe.isReady()) warm = k;
      }
      expect(warm).toBeGreaterThanOrEqual(0);
      const dirty = insertAt(clean, positions(warm, clean.length), [bad]);
      const cleanInstance = c.make();
      const dirtyInstance = c.make();
      let consumed = 0;
      for (let step = 0; step < dirty.length; step++) {
        const x = dirty[step];
        const where = `(step ${step}, input ${x})`;
        const before = dirtyInstance.getValue();
        const returned = dirtyInstance.update(x);
        if (!Number.isFinite(x)) {
          sameBits(returned, before, `${c.name} returned value on a tick that is not finite ${where}`);
        } else {
          sameBits(returned, cleanInstance.update(clean[consumed++]), `${c.name} returned value ${where}`);
        }
        sameBits(dirtyInstance.getValue(), cleanInstance.getValue(), `${c.name} getValue ${where}`);
        expect(dirtyInstance.isReady(), `${c.name} isReady ${where}`).toBe(cleanInstance.isReady());
        const dirtyParts = c.parts(dirtyInstance);
        const cleanParts = c.parts(cleanInstance);
        for (let p = 0; p < dirtyParts.length; p++) sameBits(dirtyParts[p], cleanParts[p], `${c.name} getter ${p} ${where}`);
      }
      expect(consumed).toBe(clean.length);
    });
  });

  it.each(priceCases.map((c) => [c.name, c] as const))("%s: a first tick that is not finite leaves it as freshly built", (_, c) => {
    for (const [label, bad] of BAD) {
      const fresh = c.make();
      const touched = c.make();
      sameBits(touched.update(bad), fresh.getValue(), `${c.name} first tick ${label}`);
      sameBits(touched.getValue(), 0, `${c.name} value after a first tick ${label}`);
      expect(touched.isReady()).toBe(false);
      const touchedParts = c.parts(touched);
      const freshParts = c.parts(fresh);
      for (let p = 0; p < touchedParts.length; p++) sameBits(touchedParts[p], freshParts[p], `${c.name} getter ${p} after a first tick ${label}`);
    }
  });

  it.each(priceCases.map((c) => [c.name, c] as const))("%s: the getters other than the value keep their values across a tick that is not finite", (_, c) => {
    const indicator = c.make();
    for (const price of prices().slice(0, 100)) indicator.update(price);
    const value = indicator.getValue();
    const ready = indicator.isReady();
    const parts = c.parts(indicator);
    for (const [label, bad] of BAD) {
      sameBits(indicator.update(bad), value, `${c.name} returned ${label}`);
      sameBits(indicator.getValue(), value, `${c.name} value after ${label}`);
      expect(indicator.isReady()).toBe(ready);
      const after = c.parts(indicator);
      for (let p = 0; p < parts.length; p++) sameBits(after[p], parts[p], `${c.name} getter ${p} after ${label}`);
    }
  });
});
