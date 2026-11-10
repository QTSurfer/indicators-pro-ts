import { describe, expect, it } from "vitest";
import type { AbstractRTIndicator } from "@qtsurfer/indicators";
import { AlmaRTIndicator } from "$averages/AlmaRTIndicator";
import { DemaRTIndicator } from "$averages/DemaRTIndicator";
import { EnvelopesRTIndicator } from "$averages/EnvelopesRTIndicator";
import { FramaRTIndicator } from "$averages/FramaRTIndicator";
import { LeastSquaresMovingAverageRTIndicator } from "$averages/LeastSquaresMovingAverageRTIndicator";
import { McGinleyDynamicRTIndicator } from "$averages/McGinleyDynamicRTIndicator";
import { AdaptiveFisherTransformRTIndicator } from "$momentum/AdaptiveFisherTransformRTIndicator";
import { ChandeForecastOscillatorRTIndicator } from "$momentum/ChandeForecastOscillatorRTIndicator";
import { CmoRTIndicator } from "$momentum/CmoRTIndicator";
import { ConnorsRsiRTIndicator } from "$momentum/ConnorsRsiRTIndicator";
import { CoppockCurveRTIndicator } from "$momentum/CoppockCurveRTIndicator";
import { DetrendedPriceOscillatorRTIndicator } from "$momentum/DetrendedPriceOscillatorRTIndicator";
import { FisherTransformRTIndicator } from "$momentum/FisherTransformRTIndicator";
import { KnowSureThingRTIndicator } from "$momentum/KnowSureThingRTIndicator";
import { MomentumRTIndicator } from "$momentum/MomentumRTIndicator";
import { RocRTIndicator } from "$momentum/RocRTIndicator";
import { TrixRTIndicator } from "$momentum/TrixRTIndicator";
import { TrueStrengthIndexRTIndicator } from "$momentum/TrueStrengthIndexRTIndicator";
import { LOG_TOLERANCE, expectSeries } from "./compare";

// A price that is not finite (NaN, Infinity, -Infinity) is ignored by these 18 indicators, as it is by the Java engine's:
// nothing is updated (no window, inner average, counter, accumulator or flag), `update` returns the value it held, and
// every other getter keeps its last value. The property: an instance fed a series with such ticks put in anywhere
// behaves, from then on and at every later step, exactly like one fed the same series without them, bit for bit.
// The second half builds, for every hold on a value worked out from the price, an input that makes that value overflow
// (prices near Number.MAX_VALUE), and pins what the Java engine gives for it, and the cases that are left unguarded on
// purpose.

const MAX = Number.MAX_VALUE;
const SERIES_LENGTH = 240;
const BAD = [
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["-Infinity", -Infinity],
] as const;

interface Case {
  name: string;
  make: () => AbstractRTIndicator;
  /** The getters besides the value. */
  parts: (indicator: AbstractRTIndicator) => number[];
}

function of<T extends AbstractRTIndicator>(name: string, make: () => T, parts: (indicator: T) => number[] = () => []): Case {
  return { name, make, parts: parts as (indicator: AbstractRTIndicator) => number[] };
}

/** The 18 classes, with parameters short enough to warm up well inside the series. */
const registry: Case[] = [
  of("Alma", () => new AlmaRTIndicator(10)),
  of("Dema", () => new DemaRTIndicator(10)),
  of("Envelopes", () => new EnvelopesRTIndicator(10, 2.5), (i) => [i.getUpper(), i.getLower()]),
  of("Frama", () => new FramaRTIndicator(10), (i) => [i.getFractalDimension(), i.getAlpha(), i.periods]),
  of("LeastSquaresMovingAverage", () => new LeastSquaresMovingAverageRTIndicator(10)),
  of("McGinleyDynamic", () => new McGinleyDynamicRTIndicator(10)),
  of("Momentum", () => new MomentumRTIndicator(10)),
  of("Roc", () => new RocRTIndicator(10)),
  of("Cmo", () => new CmoRTIndicator(10)),
  of("DetrendedPriceOscillator", () => new DetrendedPriceOscillatorRTIndicator(10)),
  of("ChandeForecastOscillator", () => new ChandeForecastOscillatorRTIndicator(10), (i) => [i.getLsmaValue()]),
  of("ConnorsRsi", () => new ConnorsRsiRTIndicator(3, 2, 20)),
  of("CoppockCurve", () => new CoppockCurveRTIndicator(10, 7, 5)),
  of("FisherTransform", () => new FisherTransformRTIndicator(10)),
  of("AdaptiveFisherTransform", () => new AdaptiveFisherTransformRTIndicator(5, 3, 12), (i) => [i.getEfficiencyRatio(), i.getAdaptivePeriod()]),
  of("KnowSureThing", () => new KnowSureThingRTIndicator([3, 4, 5, 6], [3, 3, 3, 4], [1, 2, 3, 4], 3), (i) => [i.getSignal()]),
  of("Trix", () => new TrixRTIndicator(5)),
  of("TrueStrengthIndex", () => new TrueStrengthIndexRTIndicator(8, 4)),
];

/** Deterministic, positive, not trivial: a trend, two cycles, a sawtooth and flat ticks. */
function series(): number[] {
  const out: number[] = [];
  let previous = 100;
  for (let i = 0; i < SERIES_LENGTH; i++) {
    let value = 100 + 20 * Math.sin(i * 0.17) + 5 * Math.cos(i * 0.9) + (i % 11) * 0.25 + i * 0.05;
    if (i % 13 === 12) value = previous; // an unchanged price: the flat branches (a zero streak, a zero change)
    out.push(value);
    previous = value;
  }
  return out;
}

/** The index in the clean series of the tick after which the instance is ready. */
function warmUpIndex(c: Case, clean: readonly number[]): number {
  const indicator = c.make();
  for (let k = 0; k < clean.length; k++) {
    indicator.update(clean[k]);
    if (indicator.isReady()) return k;
  }
  throw new Error(`${c.name} never becomes ready on the test series`);
}

/** The group put before the clean ticks at `positions`; a position equal to the length appends. */
function insertAt(clean: readonly number[], positions: Iterable<number>, group: readonly number[]): number[] {
  const at = new Set(positions);
  const out: number[] = [];
  for (let k = 0; k <= clean.length; k++) {
    if (at.has(k)) out.push(...group);
    if (k < clean.length) out.push(clean[k]);
  }
  return out;
}

function positions(warm: number, length: number): number[] {
  // the start, a hundred ticks in, the end, and the ticks around the one that makes the instance ready
  return [...new Set([0, 1, 100, 199, length, Math.max(0, warm - 1), warm, warm + 1])].filter((p) => p <= length);
}

function sameBits(actual: number, expected: number, what: string): void {
  expect(Object.is(actual, expected), `${what}: ${actual} against ${expected}`).toBe(true);
}

function sameState(c: Case, dirty: AbstractRTIndicator, clean: AbstractRTIndicator, where: string): void {
  sameBits(dirty.getValue(), clean.getValue(), `${c.name} getValue ${where}`);
  expect(dirty.isReady(), `${c.name} isReady ${where}`).toBe(clean.isReady());
  const dirtyParts = c.parts(dirty);
  const cleanParts = c.parts(clean);
  expect(dirtyParts, `${c.name} getters ${where}`).toHaveLength(cleanParts.length);
  for (let p = 0; p < dirtyParts.length; p++) sameBits(dirtyParts[p], cleanParts[p], `${c.name} getter ${p} ${where}`);
}

function runAndCompare(c: Case, clean: readonly number[], dirtySeries: readonly number[]): void {
  const cleanInstance = c.make();
  const dirtyInstance = c.make();
  let consumed = 0; // the ticks of the clean series taken so far
  let previousReturn = dirtyInstance.getValue(); // what a held tick must return
  for (let step = 0; step < dirtySeries.length; step++) {
    const x = dirtySeries[step];
    const where = `(step ${step}, input ${x})`;
    const returned = dirtyInstance.update(x);
    if (!Number.isFinite(x)) {
      sameBits(returned, previousReturn, `${c.name} returned value on a tick that is not finite ${where}`);
    } else {
      sameBits(returned, cleanInstance.update(clean[consumed++]), `${c.name} returned value ${where}`);
    }
    previousReturn = returned;
    sameState(c, dirtyInstance, cleanInstance, where);
    if (dirtyInstance.isReady()) {
      expect(Number.isFinite(returned), `${c.name} finite once warm ${where}`).toBe(true);
      for (const part of c.parts(dirtyInstance)) expect(Number.isFinite(part), `${c.name} getter finite once warm ${where}`).toBe(true);
    }
  }
  expect(consumed, "every clean tick was taken").toBe(clean.length);
}

describe("a price that is not finite", () => {
  it("is held by the 18 classes of the registry, and by no other", () => {
    expect(registry).toHaveLength(18);
    expect(new Set(registry.map((c) => c.name)).size).toBe(18);
  });

  describe.each(registry.flatMap((c) => BAD.map(([label, bad]) => [c.name, label, c, bad] as const)))("%s with %s put in", (_name, _label, c, bad) => {
    it("behaves like the series without it, at every later step", () => {
      const clean = series();
      const dirty = insertAt(clean, positions(warmUpIndex(c, clean), clean.length), [bad]);
      expect(dirty.length).toBeGreaterThan(clean.length);
      runAndCompare(c, clean, dirty);
    });
  });

  it.each(registry.map((c) => [c.name, c] as const))("%s: a burst of NaN, Infinity and -Infinity behaves like no ticks at all", (_, c) => {
    const clean = series();
    const dirty = insertAt(clean, [0, 7, warmUpIndex(c, clean), 120], [NaN, Infinity, -Infinity]);
    runAndCompare(c, clean, dirty);
  });

  it.each(registry.map((c) => [c.name, c] as const))("%s: a first tick that is not finite leaves it as freshly built", (_, c) => {
    for (const [label, bad] of BAD) {
      const fresh = c.make();
      const touched = c.make();
      sameBits(touched.update(bad), fresh.getValue(), `${c.name} first tick ${label}`);
      sameState(c, touched, fresh, `after a first tick of ${label}`);
      expect(touched.isReady()).toBe(false);
      expect(touched.getValue()).toBe(0);
    }
  });

  it.each(registry.map((c) => [c.name, c] as const))("%s: the getters other than the value keep their values across a tick that is not finite", (_, c) => {
    const indicator = c.make();
    for (const price of series().slice(0, 100)) indicator.update(price);
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

  it("Envelopes keeps its bands at the values they had", () => {
    const envelopes = new EnvelopesRTIndicator(5, 10);
    const out: number[] = [];
    const bands: number[][] = [];
    for (const price of [100, NaN, Infinity, 102]) {
      out.push(envelopes.update(price));
      bands.push([envelopes.getUpper(), envelopes.getLower()]);
    }
    // the values the Java engine gives
    expect(out).toEqual([100, 100, 100, 100.66666666666667]);
    expect(bands).toEqual([
      [110.00000000000001, 90],
      [110.00000000000001, 90],
      [110.00000000000001, 90],
      [110.73333333333335, 90.60000000000001],
    ]);
  });
});

// Holds on a value worked out from the price. Each input below makes that value overflow while the prices are finite
// (|price| near Number.MAX_VALUE); the expected values are the ones the Java engine gives for the same input.

function run(indicator: AbstractRTIndicator, ...prices: number[]): number[] {
  return prices.map((price) => indicator.update(price));
}

function assertAllFinite(values: readonly number[]): void {
  values.forEach((v, k) => expect(Number.isFinite(v), `value at step ${k}: ${v}`).toBe(true));
}

describe("a value worked out from the price that overflows", () => {
  it("TSI holds when the change of the price overflows, and drops the tick", () => {
    // MAX then -MAX: the change is -Infinity. The tick is dropped: no average takes it (with periods of 1 the
    // indicator is still not ready) and the price before stays the reference.
    const tsi = new TrueStrengthIndexRTIndicator(1, 1);
    expect(run(tsi, MAX, -MAX)).toEqual([0, 0]);
    expect(tsi.isReady()).toBe(false);
    expect(tsi.update(MAX)).toBe(0); // MAX - MAX: the reference is still the first price
    expect(tsi.isReady()).toBe(true);
    const withTick = run(new TrueStrengthIndexRTIndicator(3, 2), 100, 103, 101, MAX, -MAX, MAX);
    const without = run(new TrueStrengthIndexRTIndicator(3, 2), 100, 103, 101, MAX, MAX);
    expect(withTick).toEqual([0, 100, 50.00000000000001, Infinity, Infinity, Infinity]);
    expect(without).toEqual([0, 100, 50.00000000000001, Infinity, Infinity]);
    expect(withTick[4]).toBe(withTick[3]);
    expect(withTick[5]).toBe(without[4]);
  });

  it("CMO holds when the change of the price overflows, and keeps the price before as the reference", () => {
    const withTick = run(new CmoRTIndicator(3), MAX, -MAX, MAX, 1, 2);
    const without = run(new CmoRTIndicator(3), MAX, MAX, 1, 2);
    expect(withTick).toEqual([0, 0, 0, -100, -100]);
    expect(without).toEqual([0, 0, -100, -100]);
    expect(withTick[1]).toBe(withTick[0]);
    expect(withTick.slice(2)).toEqual(without.slice(1));
    assertAllFinite(withTick);
  });

  it("McGinley holds when the step overflows, and advances nothing", () => {
    // the average is -MAX and the price MAX: price - average is Infinity
    const withTick = run(new McGinleyDynamicRTIndicator(5), -MAX, MAX, 100, 101, 102);
    const without = run(new McGinleyDynamicRTIndicator(5), -MAX, 100, 101, 102);
    expect(withTick).toEqual([-MAX, -MAX, 100, 100.19219606889656, 100.52879770169746]);
    expect(without).toEqual([-MAX, 100, 100.19219606889656, 100.52879770169746]);
    expect(withTick.slice(2)).toEqual(without.slice(1));
  });

  it("Coppock holds when a rate of change overflows, so the average is never poisoned", () => {
    // ROC(1) of 1e-300 to 1e10 is Infinity. The average has no guard of its own and would stay Infinity or NaN for
    // good. The windows of the rates take the price; only the average is skipped.
    const out = run(new CoppockCurveRTIndicator(1, 1, 3), 1e-300, 1e10, 100, 101, 102, 103);
    expect(out).toEqual([0, 0, -133.33333199999998, -65.66666599999999, -31.676567323432337, 1.9737914967967416]);
    expect(out[1]).toBe(out[0]);
    assertAllFinite(out);
    // with no price of 1e10 the rate is finite, but huge: the average takes it
    expect(run(new CoppockCurveRTIndicator(1, 1, 3), 1e-300, 100, 101, 102, 103)).toEqual([
      0, 1.3333333333333332e304, 6.666666666666666e303, 3.333333333333333e303, 0.9803921568627451,
    ]);
  });

  it("FRAMA holds when its next value overflows, keeps its outputs, and has taken the price in", () => {
    const frama = new FramaRTIndicator(4);
    const values: number[] = [];
    const parts: number[][] = [];
    for (const price of [1, 2, 3, 4, MAX, -MAX, 100, 101]) {
      values.push(frama.update(price));
      parts.push([frama.getFractalDimension(), frama.getAlpha()]);
    }
    // Java's values; the logarithms and the exponential are held to a relative 1e-12
    expectSeries(values, [1, 2, 3, 4, 1.7976931348616144e308, 1.7976931348616144e308, 100, 100], "FRAMA value", LOG_TOLERANCE);
    expectSeries(parts.map((p) => p[0]), [0, 0, 0, 0.4150374992788438, 1.0000000000000848, 1.0000000000000848, -Infinity, -Infinity], "FRAMA fractal dimension", LOG_TOLERANCE);
    expectSeries(parts.map((p) => p[1]), [0, 0, 0, 1, 0.9999999999996099, 0.9999999999996099, 1, 1], "FRAMA alpha", LOG_TOLERANCE);
    // tick 6 (-MAX): the window [3, 4, MAX, -MAX] has ranges that overflow, the next value is NaN: it holds and nothing
    // is assigned
    assertAllFinite(values);
    expect(values[5]).toBe(values[4]);
    expect(parts[5]).toEqual(parts[4]);
    // tick 7 (100): only the range of the whole window overflows, so the dimension is -Infinity; the alpha it gives is 1
    expect(values[6]).toBe(100);
  });

  it("Fisher holds when the normalized price is NaN, and the window has taken the price", () => {
    // the window [MAX, -MAX, MAX]: the range is Infinity and price - min is Infinity
    const out = run(new FisherTransformRTIndicator(3), MAX, -MAX, MAX, 100, 101);
    expectSeries(out, [0, -0.3424579708431785, -0.3424579708431785, -0.3424579708431785, -0.619168607902248], "Fisher", LOG_TOLERANCE);
    assertAllFinite(out);
    expect(out[2]).toBe(out[1]);
    // without that tick the window is not the same, so the later values are not either
    const without = run(new FisherTransformRTIndicator(3), MAX, -MAX, 100, 101);
    expectSeries(without, [0, -0.3424579708431785, -0.3424579708431785, 0.10922337302486722], "Fisher without the tick", LOG_TOLERANCE);
  });

  it("the adaptive Fisher holds when the normalized price is NaN, and the ratio and the period have advanced", () => {
    const adaptive = new AdaptiveFisherTransformRTIndicator(2, 2, 3);
    const out: number[] = [];
    const parts: number[][] = [];
    for (const price of [MAX, -MAX, MAX, 100, 101]) {
      out.push(adaptive.update(price));
      parts.push([adaptive.getEfficiencyRatio(), adaptive.getAdaptivePeriod()]);
    }
    expectSeries(out, [0, -0.5486396997168943, -0.5486396997168943, -0.5486396997168943, -0.019173686871845508], "adaptive Fisher", LOG_TOLERANCE);
    expect(parts).toEqual([[0, 3], [0, 3], [0, 3], [0, 3], [1, 2]]);
    assertAllFinite(out);
    expect(out[2]).toBe(out[1]);
  });
});

// What stays unguarded on purpose: the value worked out is only returned, or it goes into a state that it cannot
// corrupt. These pin the Java behaviour so that a later change is deliberate.

describe("what is left unguarded on purpose", () => {
  it("ROC of a zero base price is 0, not Infinity", () => {
    expect(run(new RocRTIndicator(1), 0, 5, 6)).toEqual([0, 0, 20]);
  });

  it("ROC of a base price near zero is Infinity for that tick only, because it is not folded into anything", () => {
    const out = run(new RocRTIndicator(1), 1e-300, 1e10, 5);
    expect(out).toEqual([0, Infinity, -99.99999994999999]);
  });

  it("Connors RSI ranks an infinite rate of change with no hold and stays in 0 to 100", () => {
    // a last price of 1e-310 makes the one-tick rate of change Infinity; the rank only compares it
    const out = run(new ConnorsRsiRTIndicator(3, 2, 5), 1e-310, 100, 101, 102, 103, 104, 105, 106, 107, 108);
    for (const v of out) expect(v >= 0 && v <= 100, `${v}`).toBe(true);
    expect(out[9]).not.toBe(out[1]);
    expect(out.slice(0, 3)).toEqual([0, 33.333333333333336, 66.66666666666667]);
  });

  it("KST drops a rate of change that overflows through the guard of the free average", () => {
    const kst = new KnowSureThingRTIndicator([1], [2], [1], 2);
    const out: number[] = [];
    const signal: number[] = [];
    for (const price of [1e-300, 1e10, 100, 101, 102]) {
      out.push(kst.update(price));
      signal.push(kst.getSignal());
    }
    expect(out).toEqual([0, 0, -49.999999499999994, -49.999999499999994, 0.995049504950495]);
    expect(signal).toEqual([0, 0, 0, -49.999999499999994, -49.999999499999994]);
    assertAllFinite(out);
  });

  it("McGinley freezes at the smallest double, because the step vanishes", () => {
    // not a value that is not finite: price / average is Infinity, the divisor is Infinity and the step is 0
    expect(run(new McGinleyDynamicRTIndicator(5), Number.MIN_VALUE, 100, 101, 102)).toEqual([Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]);
  });

  it("TRIX is a returned ratio, so it is Infinity for a tiny denominator and recovers at once", () => {
    const out = run(new TrixRTIndicator(1), 1e-310, 1e10, 100);
    expect(out).toEqual([0, Infinity, -99.99999899999999]);
  });

  it("momentum, which returns a difference, is -Infinity for the one tick that overflows it", () => {
    expect(run(new MomentumRTIndicator(1), MAX, -MAX, 5)).toEqual([0, -Infinity, MAX]);
  });

  it("DPO keeps its running sum Infinity once prices near the largest double overflow it", () => {
    expect(run(new DetrendedPriceOscillatorRTIndicator(3), MAX, MAX, MAX, 1, 2, 3, 4)).toEqual([0, 0, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity]);
  });
});
