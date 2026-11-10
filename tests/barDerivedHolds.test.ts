import type { Kline } from "@qtsurfer/core";
import type { AbstractRTIndicator } from "@qtsurfer/indicators";
import { describe, expect, it } from "vitest";
import { ChandeKrollStopRTIndicator } from "$trend/ChandeKrollStopRTIndicator";
import { ChandelierExitRTIndicator } from "$trend/ChandelierExitRTIndicator";
import { DonchianChannelRTIndicator } from "$trend/DonchianChannelRTIndicator";
import { EfficiencyRatioRTIndicator } from "$trend/EfficiencyRatioRTIndicator";
import { ParabolicSarRTIndicator } from "$trend/ParabolicSarRTIndicator";
import { VortexRTIndicator } from "$trend/VortexRTIndicator";
import { ChoppinessIndexRTIndicator } from "$volatility/ChoppinessIndexRTIndicator";
import { KeltnerChannelRTIndicator } from "$volatility/KeltnerChannelRTIndicator";
import { MassIndexRTIndicator } from "$volatility/MassIndexRTIndicator";
import { NatrRTIndicator } from "$volatility/NatrRTIndicator";
import { RelativeVolatilityIndexRTIndicator } from "$volatility/RelativeVolatilityIndexRTIndicator";
import { LOG_TOLERANCE, expectSeries } from "./compare";

// Holds on a value worked out from the fields of a bar (or from the price). Each input below makes that value overflow
// while the fields are finite (a price near the largest double); the expected rows are the ones the Java engine gives
// for the same input: [value, ready, then the getters named in each test]. Then the cases that are left unguarded on
// purpose, where the value worked out is only returned, or the ATR it comes from has already taken the bar.

const MAX = Number.MAX_VALUE;

type HLC = readonly [high: number, low: number, close: number];
type BarIndicator = AbstractRTIndicator & { updateFrom(bar: Kline): void };

function runBars<T extends BarIndicator>(indicator: T, bars: readonly HLC[], parts: ((indicator: T) => number)[] = []): number[][] {
  return bars.map(([high, low, close], i) => {
    indicator.updateFrom({ instrument: "BTC/USDT", open: close, high, low, close, volume: 0, quoteVolume: 0, numberOfTrades: 1, timestamp: i });
    return [indicator.getValue(), indicator.isReady() ? 1 : 0, ...parts.map((part) => part(indicator))];
  });
}

function runPrices<T extends AbstractRTIndicator>(indicator: T, prices: readonly number[], parts: ((indicator: T) => number)[] = []): number[][] {
  return prices.map((price) => {
    indicator.update(price);
    return [indicator.getValue(), indicator.isReady() ? 1 : 0, ...parts.map((part) => part(indicator))];
  });
}

/** The rows equal Java's, column by column, to the last bit (Object.is: even NaN and the sign of a zero) or to a tolerance. */
function expectRows(actual: readonly number[][], expected: readonly number[][], label: string, tolerance = 0): void {
  expect(actual, `${label}: rows`).toHaveLength(expected.length);
  for (let column = 0; column < expected[0].length; column++) {
    expectSeries(actual.map((row) => row[column]), expected.map((row) => row[column]), `${label} column ${column}`, tolerance);
  }
}

function assertAllFinite(rows: readonly number[][], label: string): void {
  rows.forEach((row, k) => row.forEach((v, c) => expect(Number.isFinite(v), `${label}: row ${k} column ${c}: ${v}`).toBe(true)));
}

const vortexMovementOverflow: number[][] = [
  [0.0, 0, 0.0, 0.0],
  [0.0, 0, 0.0, 0.0],
  [2.9961552247705263e307, 0, 2.9961552247705263e307, 0.16666666666666666],
  [2.2471164185778946e307, 0, 2.2471164185778946e307, 0.25],
  [1.7976931348623158e307, 1, 1.7976931348623158e307, 0.3],
  [0.0, 1, 0.5, 0.5],
  [0.0, 1, 0.5, 0.5],
];

const vortexMovementOverflowAbsent: number[][] = [
  [0.0, 0, 0.0, 0.0],
  [2.9961552247705263e307, 0, 2.9961552247705263e307, 0.16666666666666666],
  [2.2471164185778946e307, 0, 2.2471164185778946e307, 0.25],
  [1.7976931348623158e307, 1, 1.7976931348623158e307, 0.3],
  [0.0, 1, 0.5, 0.5],
  [0.0, 1, 0.5, 0.5],
];

const vortexSumOverflow: number[][] = [
  [0.0, 0, 0.0, 0.0],
  [0.0, 0, 1.0, 1.0],
  [0.0, 0, 1.0, 1.0],
  [0.0, 0, 1.0, 1.0],
  [0.0, 0, 1.0, 1.0],
  [0.0, 0, 1.0, 1.0],
  [0.0, 0, 1.0, 1.0],
];

const choppinessRangeOverflow: number[][] = [
  [0.0, 0],
  [0.0, 0],
  [30.627022844349533, 0],
  [42.781573999644536, 1],
  [42.781573999644536, 1],
  [38.49008928642873, 1],
  [63.09297535714574, 1],
];

const choppinessRangeOverflowAbsent: number[][] = [
  [0.0, 0],
  [30.627022844349533, 0],
  [42.781573999644536, 1],
  [38.49008928642873, 1],
  [63.09297535714574, 1],
];

const massIndexRangeOverflow: number[][] = [
  [0.0, 0],
  [1.0, 0],
  [2.090909090909091, 0],
  [2.090909090909091, 0],
  [3.207188160676533, 1],
  [3.2684126504724516, 1],
  [3.205340818664003, 1],
];

const massIndexRangeOverflowAbsent: number[][] = [
  [1.0, 0],
  [2.090909090909091, 0],
  [3.207188160676533, 1],
  [3.2684126504724516, 1],
  [3.205340818664003, 1],
];

const chandeKrollRangeOverflow: number[][] = [
  [10.5, 0, 8.5],
  [10.5, 1, 8.5],
  [11.0, 1, 9.25],
  [11.0, 1, 9.25],
  [11.0, 1, 9.25],
  [11.0, 1, 9.25],
];

const chandeKrollRangeOverflowMultiplier0: number[][] = [
  [9.5, 0, 9.5],
  [9.5, 1, 10.0],
  [9.5, 1, 11.0],
  [9.5, 1, 11.0],
  [9.5, 1, 11.0],
  [9.5, 1, 11.0],
];

const parabolicSarSecondBarOverflow: number[][] = [
  [-1.7976931348623157e308, 0, 1.0],
  [-1.7976931348623157e308, 1, 0.0],
  [-1.7976931348623157e308, 1, 0.0],
  [-1.7976931348623157e308, 1, 0.0],
];

const parabolicSarUpSecondBarOverflow: number[][] = [
  [-1.7976931348623157e308, 0, 1.0],
  [-1.7976931348623157e308, 1, 1.0],
  [-1.7976931348623157e308, 1, 1.0],
];

const parabolicSarLaterOverflow: number[][] = [
  [90.0, 0, 1.0],
  [1.7976931348623157e308, 1, 0.0],
  [95.0, 1, 1.0],
  [1.7976931348623157e308, 1, 0.0],
  [1.7617392721650694e308, 1, 0.0],
];

const efficiencyRatioDistanceOverflow: number[][] = [
  [0.0, 0, 0.0, 0.0],
  [0.0, 0, 0.0, 0.0],
  [0.0, 0, 0.0, 0.0],
  [0.0, 0, 0.0, 0.0],
  [0.0, 1, 2.0, Infinity],
  [1.0, 1, 1.7976931348623157e308, 1.7976931348623157e308],
  [1.0, 1, 3.0, 3.0],
];

const efficiencyRatioDistanceOverflowAbsent: number[][] = [
  [0.0, 0, 0.0, 0.0],
  [0.0, 0, 0.0, 0.0],
  [0.0, 0, 0.0, 0.0],
  [0.0, 1, 2.0, Infinity],
  [1.0, 1, 1.7976931348623157e308, 1.7976931348623157e308],
  [1.0, 1, 3.0, 3.0],
];

const relativeVolatilityIndexVarianceOverflow: number[][] = [
  [50.0, 0, 0.0],
  [50.0, 0, 0.0],
  [50.0, 0, 0.0],
  [50.0, 0, 0.0],
  [50.0, 0, 0.0],
  [50.0, 0, 0.0],
  [50.0, 0, 0.0],
  [100.0, 0, 0.0],
  [100.0, 1, 0.0],
  [100.0, 1, 0.0],
];

const natrTinyClose: number[][] = [
  [100.0, 0],
  [Infinity, 0],
  [88.88888888888889, 1],
  [55.55555555555556, 1],
];

const natrRangeOverflow: number[][] = [
  [10.526315789473683, 0],
  [0.0, 1],
  [NaN, 1],
  [NaN, 1],
];

const donchianMiddleOverflow: number[][] = [
  [Infinity, 0, 1.7976931348623157e308, 1.7976931348623157e308],
  [Infinity, 1, 1.7976931348623157e308, 1.7976931348623157e308],
  [8.988465674311579e307, 1, 1.7976931348623157e308, 1.0],
  [1.0, 1, 1.0, 1.0],
];

const chandelierRangeOverflow: number[][] = [
  [7.0, 0, 7.0, 12.0],
  [-Infinity, 1, -Infinity, Infinity],
  [NaN, 1, NaN, NaN],
  [NaN, 1, NaN, NaN],
];

const keltnerRangeOverflow: number[][] = [
  [9.5, 0, 11.0, 8.0],
  [3.166666666666667, 1, Infinity, -Infinity],
  [8.38888888888889, 1, NaN, NaN],
  [10.796296296296296, 1, NaN, NaN],
];

describe("a value worked out from finite fields that overflows", () => {
  it("Vortex holds when a movement overflows, and keeps the previous bar as the reference", () => {
    // bar 1: high - prevLow is MAX - (-MAX), Infinity
    const bars: HLC[] = [[5, -MAX, 0], [MAX, 1, 2], [6, 4, 5], [7, 5, 6], [8, 6, 7], [9, 7, 8], [10, 8, 9]];
    const parts = [(i: VortexRTIndicator) => i.getVIPlus(), (i: VortexRTIndicator) => i.getVIMinus()];
    const rows = runBars(new VortexRTIndicator(3), bars, parts);
    expectRows(rows, vortexMovementOverflow, "Vortex movement overflow");
    expect(rows[1]).toEqual(rows[0]);
    // the bar that was held leaves no trace: the bars after it give what they give without it
    const without = runBars(new VortexRTIndicator(3), bars.filter((_, k) => k !== 1), parts);
    expectRows(without, vortexMovementOverflowAbsent, "Vortex without the bar");
    expect(rows.slice(2)).toEqual(without.slice(1));
  });

  it("Vortex holds when a running sum overflows, and advances nothing", () => {
    // the sums reach MAX on the second bar and overflow on the third; every bar after it is the same one, held too
    const half: HLC = [MAX / 2, 0, MAX / 4];
    const bars: HLC[] = [half, half, half, half, half, [10, 9, 9.5], [11, 10, 10.5]];
    const rows = runBars(new VortexRTIndicator(3), bars, [(i) => i.getVIPlus(), (i) => i.getVIMinus()]);
    expectRows(rows, vortexSumOverflow, "Vortex sum overflow");
    expect(rows[3]).toEqual(rows[2]);
    expect(rows[4]).toEqual(rows[2]);
    assertAllFinite(rows, "Vortex sum overflow");
  });

  it("Choppiness holds when the true range overflows, on the first bar and on a later one", () => {
    const bars: HLC[] = [[MAX, -MAX, 0], [10, 9, 9.5], [11, 9.2, 10], [12, 10, 11], [MAX, -MAX, 0], [13, 11, 12], [12.5, 10.5, 11.5]];
    const rows = runBars(new ChoppinessIndexRTIndicator(3), bars);
    expectRows(rows, choppinessRangeOverflow, "Choppiness range overflow", LOG_TOLERANCE);
    // a first bar that is held leaves the indicator as built: the next bar is the first one
    const without = runBars(new ChoppinessIndexRTIndicator(3), bars.filter((_, k) => k !== 0 && k !== 4));
    expectRows(without, choppinessRangeOverflowAbsent, "Choppiness without the bars", LOG_TOLERANCE);
    expect(rows[0]).toEqual([0, 0]);
    expect(rows[4]).toEqual(rows[3]);
    expectSeries(rows.slice(1, 4).map((r) => r[0]), without.slice(0, 3).map((r) => r[0]), "Choppiness after a first bar that is held", LOG_TOLERANCE);
    expectSeries(rows.slice(5).map((r) => r[0]), without.slice(3).map((r) => r[0]), "Choppiness after a later bar that is held", LOG_TOLERANCE);
  });

  it("Mass index holds when the range overflows, so the second average is never fed a held value as a tick", () => {
    const bars: HLC[] = [[MAX, -MAX, 0], [10, 9, 9.5], [11, 9.5, 10], [MAX, -MAX, 0], [12, 10, 11], [13, 11, 12], [12.5, 10.5, 11.5]];
    const rows = runBars(new MassIndexRTIndicator(3, 2), bars);
    expectRows(rows, massIndexRangeOverflow, "Mass index range overflow");
    const without = runBars(new MassIndexRTIndicator(3, 2), bars.filter((_, k) => k !== 0 && k !== 3));
    expectRows(without, massIndexRangeOverflowAbsent, "Mass index without the bars");
    expect(rows[0][0]).toBe(0);
    expect(rows[3]).toEqual(rows[2]);
    expect(rows.slice(1, 3)).toEqual(without.slice(0, 2));
    expect(rows.slice(4)).toEqual(without.slice(2));
    assertAllFinite(rows, "Mass index range overflow");
  });

  it("Chande Kroll holds when the first stops overflow: the ATR and the closes have taken the bar, so it stays held", () => {
    // MAX - (-MAX) is Infinity: the ATR is Infinity, the first stop -Infinity. The ATR stays Infinity only until it has
    // warmed up; on the next bar it is NaN, so every later bar is held too
    const bars: HLC[] = [[10, 9, 9.5], [11, 9, 10], [12, 10, 11], [MAX, -MAX, 0], [12, 10, 11], [13, 11, 12]];
    const rows = runBars(new ChandeKrollStopRTIndicator(2, 1.0, 2, 2), bars, [(i) => i.getStopShort()]);
    expectRows(rows, chandeKrollRangeOverflow, "Chande Kroll range overflow");
    expect(rows.slice(3)).toEqual([rows[2], rows[2], rows[2]]);
    // a multiplier of 0 does not help: 0 * Infinity is NaN
    const zero = runBars(new ChandeKrollStopRTIndicator(2, 0.0, 2, 2), bars, [(i) => i.getStopShort()]);
    expectRows(zero, chandeKrollRangeOverflowMultiplier0, "Chande Kroll range overflow, multiplier 0");
    expect(zero.slice(2)).toEqual([zero[2], zero[2], zero[2], zero[2]]);
    assertAllFinite(rows, "Chande Kroll range overflow");
  });

  it("Parabolic SAR holds when the SAR overflows, and the bar has counted and set the trend", () => {
    // bar 2 sets the trend (down), the SAR (MAX) and the extreme point (-MAX) from itself, then the next SAR is -Infinity
    const bars: HLC[] = [[MAX, -MAX, 0], [MAX, -MAX, 0], [10, 9, 9.5], [11, 8, 9]];
    const rows = runBars(new ParabolicSarRTIndicator(), bars, [(i) => (i.isUpTrend() ? 1 : 0)]);
    expectRows(rows, parabolicSarSecondBarOverflow, "Parabolic SAR second bar overflow");
    expect(rows[0].slice(0, 2)).toEqual([-MAX, 0]);
    expect(rows[1].slice(0, 2)).toEqual([-MAX, 1]); // the value is the one before, the bar counted
    expect(rows[0][2]).toBe(1);
    expect(rows[1][2]).toBe(0);
    // the up trend: the SAR is -MAX, the extreme point MAX
    expectRows(
      runBars(new ParabolicSarRTIndicator(), [[5, -MAX, 0], [MAX, 1, 2], [10, 9, 9.5]], [(i) => (i.isUpTrend() ? 1 : 0)]),
      parabolicSarUpSecondBarOverflow,
      "Parabolic SAR up second bar overflow",
    );
    // a SAR that overflows later, after a normal start
    expectRows(
      runBars(new ParabolicSarRTIndicator(), [[100, 90, 95], [MAX, 95, 100], [MAX, -MAX, 0], [101, 99, 100], [102, 100, 101]], [(i) => (i.isUpTrend() ? 1 : 0)]),
      parabolicSarLaterOverflow,
      "Parabolic SAR later overflow",
    );
  });

  it("Efficiency ratio holds when the distance overflows, and keeps the previous price as the reference", () => {
    const parts = [(i: EfficiencyRatioRTIndicator) => i.getDirection(), (i: EfficiencyRatioRTIndicator) => i.getVolatility()];
    const rows = runPrices(new EfficiencyRatioRTIndicator(3), [1, MAX, -MAX, 2, 3, 4, 5], parts);
    expectRows(rows, efficiencyRatioDistanceOverflow, "Efficiency ratio distance overflow");
    const without = runPrices(new EfficiencyRatioRTIndicator(3), [1, MAX, 2, 3, 4, 5], parts);
    expectRows(without, efficiencyRatioDistanceOverflowAbsent, "Efficiency ratio without the price");
    expect(rows[2]).toEqual(rows[1]);
    expect(rows.slice(3)).toEqual(without.slice(2));
  });

  it("the relative volatility index holds when the variance overflows, with the price in the window and the averages unchanged", () => {
    // 103 follows MAX: the window [MAX, 103, 104] is still huge, so the next two prices are held too
    const prices = [100, 101, 102, MAX, 103, 104, 105, 106, 107, 108];
    const rows = runPrices(new RelativeVolatilityIndexRTIndicator(3, 2), prices, [() => 0]);
    expectRows(rows, relativeVolatilityIndexVarianceOverflow, "Relative volatility index variance overflow");
    expect(rows.slice(3, 7).map((r) => r[0])).toEqual([50, 50, 50, 50]);
    expect(rows[6]).toEqual(rows[2]);
    assertAllFinite(rows, "Relative volatility index variance overflow");
  });
});

// What stays unguarded on purpose: the value worked out is only returned, or it goes into a state the held bar cannot
// corrupt. These pin the Java behaviour so that a later change is deliberate.

describe("what is left unguarded on purpose", () => {
  it("NATR is a returned ratio: a close near zero gives Infinity for that bar only", () => {
    const rows = runBars(new NatrRTIndicator(3), [[1.5, 0.5, 1.0], [2, 1, 1e-310], [2, 1, 1.5], [3, 2, 2.5]]);
    expectRows(rows, natrTinyClose, "NATR tiny close");
    expect(rows[1][0]).toBe(Infinity);
    expect(Number.isFinite(rows[2][0])).toBe(true);
  });

  it("the ATR is not guarded: a range that overflows makes it Infinity while it warms up and NaN after", () => {
    // NATR, the Chandelier exit and the Keltner channel follow it, in the Java engine and here
    expectRows(runBars(new NatrRTIndicator(2), [[10, 9, 9.5], [MAX, -MAX, 0], [12, 10, 11], [13, 11, 12]]), natrRangeOverflow, "NATR range overflow");
    expectRows(
      runBars(new ChandelierExitRTIndicator(2, 3.0), [[10, 9, 9.5], [MAX, -MAX, 0], [12, 10, 11], [13, 11, 12]], [(i) => i.getLongExit(), (i) => i.getShortExit()]),
      chandelierRangeOverflow,
      "Chandelier exit range overflow",
    );
    expectRows(
      runBars(new KeltnerChannelRTIndicator(2, 2, 1.5), [[10, 9, 9.5], [MAX, -MAX, 0], [12, 10, 11], [13, 11, 12]], [(i) => i.getUpper(), (i) => i.getLower()]),
      keltnerRangeOverflow,
      "Keltner channel range overflow",
    );
  });

  it("the Donchian middle line is a returned sum: two boundaries at the largest double give Infinity until one leaves", () => {
    const rows = runBars(
      new DonchianChannelRTIndicator(2),
      [[MAX, MAX, MAX], [MAX, MAX, MAX], [1, 1, 1], [1, 1, 1]],
      [(i) => i.getUpper(), (i) => i.getLower()],
    );
    expectRows(rows, donchianMiddleOverflow, "Donchian middle overflow");
    expect(rows.map((r) => r[0])).toEqual([Infinity, Infinity, MAX / 2, 1]);
  });
});
