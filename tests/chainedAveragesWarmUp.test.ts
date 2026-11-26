import { describe, expect, it } from "vitest";
import { DemaRTIndicator } from "../src/averages/DemaRTIndicator";
import { TrixRTIndicator } from "../src/momentum/TrixRTIndicator";
import { TrueStrengthIndexRTIndicator } from "../src/momentum/TrueStrengthIndexRTIndicator";
import { MassIndexRTIndicator } from "../src/volatility/MassIndexRTIndicator";

// An indicator that smooths a smoothing is ready when each stage has the `periods` values of the stage
// before it, so every stage after the first adds `periods - 1` updates. The double exponential average,
// the TRIX, the true strength index and the mass index used to say they were ready when their first
// stage was (the TSI at update 14 when its long average needs 25). The values do not change: only the
// update from which the indicator says its definition applies.
//
// Each test computes the value on its own, from plain arrays, and checks the indicator at every update:
// the value is the same as always, and it is ready from the update where its last stage has its values.

const BARS = 200;
const TOLERANCE = 1e-9;

const closes = Array.from({ length: BARS }, (_, i) => 100 + 12 * Math.sin(i / 5) + 3 * Math.cos(i / 1.7) + i * 0.3);

/** A positive range per bar. */
const ranges = Array.from({ length: BARS }, (_, i) => 4 + 2 * Math.sin(i / 3) + 1.5 * Math.cos(i / 1.3));

/** The exponential average of the values, started from the first one, as the engine does. */
function ema(values: number[], periods: number): number[] {
  const alpha = 2 / (periods + 1);
  const out = [values[0]!];
  for (let i = 1; i < values.length; i++) {
    out.push(out[i - 1]! + alpha * (values[i]! - out[i - 1]!));
  }
  return out;
}

describe("chained averages are ready when every stage has its values", () => {
  it("the double exponential average is ready at twice its periods minus one", () => {
    for (const periods of [1, 2, 5, 14, 20]) {
      const e1 = ema(closes, periods);
      const e2 = ema(e1, periods);
      const readyAt = 2 * (periods - 1) + 1;
      const dema = new DemaRTIndicator(periods);

      for (let i = 0; i < BARS; i++) {
        dema.update(closes[i]!);
        expect(dema.isReady(), `dema(${periods}) ready at update ${i + 1}`).toBe(i + 1 >= readyAt);
        expect(Math.abs(dema.getValue() - (2 * e1[i]! - e2[i]!)), `dema(${periods}) at update ${i + 1}`).toBeLessThan(TOLERANCE);
      }
    }
  });

  it("the TRIX is ready one update after its third average has its values", () => {
    for (const periods of [1, 2, 5, 14, 15]) {
      const e3 = ema(ema(ema(closes, periods), periods), periods);
      const readyAt = 3 * (periods - 1) + 2; // the rate of change needs the average one update back
      const trix = new TrixRTIndicator(periods);

      for (let i = 0; i < BARS; i++) {
        trix.update(closes[i]!);
        expect(trix.isReady(), `trix(${periods}) ready at update ${i + 1}`).toBe(i + 1 >= readyAt);
        const expected = i === 0 ? 0 : ((e3[i]! - e3[i - 1]!) / e3[i - 1]!) * 100;
        expect(Math.abs(trix.getValue() - expected), `trix(${periods}) at update ${i + 1}`).toBeLessThan(TOLERANCE);
      }
    }
  });

  it("the true strength index is ready when its short average has its values", () => {
    for (const [longPeriod, shortPeriod] of [[25, 13], [10, 4], [5, 5], [3, 8]] as const) {
      const changes: number[] = [];
      const absolute: number[] = [];
      for (let i = 1; i < BARS; i++) {
        changes.push(closes[i]! - closes[i - 1]!);
        absolute.push(Math.abs(changes[i - 1]!));
      }
      const smoothed = ema(ema(changes, longPeriod), shortPeriod);
      const smoothedAbsolute = ema(ema(absolute, longPeriod), shortPeriod);
      // the first update only gives the price the first change is taken from
      const readyAt = longPeriod + shortPeriod;
      const tsi = new TrueStrengthIndexRTIndicator(longPeriod, shortPeriod);

      for (let i = 0; i < BARS; i++) {
        tsi.update(closes[i]!);
        expect(tsi.isReady(), `tsi(${longPeriod},${shortPeriod}) ready at update ${i + 1}`).toBe(i + 1 >= readyAt);
        const expected = i === 0 ? 0 : (100 * smoothed[i - 1]!) / smoothedAbsolute[i - 1]!;
        expect(Math.abs(tsi.getValue() - expected), `tsi(${longPeriod},${shortPeriod}) at update ${i + 1}`).toBeLessThan(TOLERANCE);
      }
    }
  });

  it("the true strength index by default is ready at update 38", () => {
    const tsi = new TrueStrengthIndexRTIndicator();
    for (let i = 0; i < 37; i++) tsi.update(closes[i]!);
    expect(tsi.isReady()).toBe(false);
    tsi.update(closes[37]!);
    expect(tsi.isReady()).toBe(true);
  });

  it("the mass index is ready when its window holds only ratios of two valid averages", () => {
    for (const [sumPeriod, emaPeriod] of [[25, 9], [10, 4], [5, 1], [7, 7]] as const) {
      const single = ema(ranges, emaPeriod);
      const doubled = ema(single, emaPeriod);
      const readyAt = 2 * (emaPeriod - 1) + sumPeriod;
      const mass = new MassIndexRTIndicator(sumPeriod, emaPeriod);

      for (let i = 0; i < BARS; i++) {
        mass.update(ranges[i]!);
        expect(mass.isReady(), `massIndex(${sumPeriod},${emaPeriod}) ready at update ${i + 1}`).toBe(i + 1 >= readyAt);
        let expected = 0;
        for (let j = Math.max(0, i - sumPeriod + 1); j <= i; j++) {
          expected += single[j]! / doubled[j]!;
        }
        expect(Math.abs(mass.getValue() - expected), `massIndex(${sumPeriod},${emaPeriod}) at update ${i + 1}`).toBeLessThan(TOLERANCE);
      }
    }
  });

  it("the mass index by default is ready at update 41", () => {
    const mass = new MassIndexRTIndicator();
    for (let i = 0; i < 40; i++) mass.update(ranges[i]!);
    expect(mass.isReady()).toBe(false);
    mass.update(ranges[40]!);
    expect(mass.isReady()).toBe(true);
  });

  it("an input that is not finite does not count towards the warm-up", () => {
    const dema = new DemaRTIndicator(3); // ready at its 5th finite update
    const trix = new TrixRTIndicator(3); // 8th
    const tsi = new TrueStrengthIndexRTIndicator(3, 2); // 5th
    const mass = new MassIndexRTIndicator(3, 2); // 5th
    for (let i = 0; i < 4; i++) {
      for (const indicator of [dema, trix, tsi, mass]) {
        indicator.update(closes[i]!);
        indicator.update(Number.NaN);
      }
    }
    expect(dema.isReady() || tsi.isReady() || mass.isReady()).toBe(false);

    for (const indicator of [dema, trix, tsi, mass]) {
      indicator.update(closes[4]!);
    }

    expect(dema.isReady()).toBe(true);
    expect(tsi.isReady()).toBe(true);
    expect(mass.isReady()).toBe(true);
    expect(trix.isReady()).toBe(false);
  });

  it("a reset starts the warm-up again", () => {
    const dema = new DemaRTIndicator(5);
    const trix = new TrixRTIndicator(5);
    const tsi = new TrueStrengthIndexRTIndicator(5, 3);
    const mass = new MassIndexRTIndicator(5, 3);
    for (const close of closes) {
      dema.update(close);
      trix.update(close);
      tsi.update(close);
      mass.update(close);
    }
    expect(dema.isReady() && trix.isReady() && tsi.isReady() && mass.isReady()).toBe(true);

    dema.reset();
    trix.reset();
    tsi.reset();
    mass.reset();

    expect(dema.isReady()).toBe(false);
    expect(trix.isReady()).toBe(false);
    expect(tsi.isReady()).toBe(false);
    expect(mass.isReady()).toBe(false);
    for (let i = 0; i < 9; i++) {
      dema.update(closes[i]!);
      trix.update(closes[i]!);
      tsi.update(closes[i]!);
      mass.update(closes[i]!);
    }
    expect(dema.isReady(), "dema(5) at update 9").toBe(true);
    expect(trix.isReady(), "trix(5) needs 14, has 9").toBe(false);
    expect(tsi.isReady(), "tsi(5,3) needs 8, has 9").toBe(true);
    expect(mass.isReady(), "massIndex(5,3) needs 9").toBe(true);
  });
});
