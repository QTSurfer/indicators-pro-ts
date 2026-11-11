import type { Kline } from "@qtsurfer/core";
import type { AbstractRTIndicator } from "@qtsurfer/indicators";
import { describe, expect, it } from "vitest";
import { AcceleratorOscillatorRTIndicator } from "$momentum/AcceleratorOscillatorRTIndicator";
import { AwesomeOscillatorRTIndicator } from "$momentum/AwesomeOscillatorRTIndicator";
import { BalanceOfPowerRTIndicator } from "$momentum/BalanceOfPowerRTIndicator";
import { BullBearPowerRTIndicator } from "$momentum/BullBearPowerRTIndicator";
import { RelativeVigorIndexRTIndicator } from "$momentum/RelativeVigorIndexRTIndicator";
import { StochasticOscillatorRTIndicator } from "$momentum/StochasticOscillatorRTIndicator";
import { UltimateOscillatorRTIndicator } from "$momentum/UltimateOscillatorRTIndicator";
import { WilliamsRRTIndicator } from "$momentum/WilliamsRRTIndicator";
import { AdlRTIndicator } from "$volume/AdlRTIndicator";
import { ChaikinOscillatorRTIndicator } from "$volume/ChaikinOscillatorRTIndicator";
import { EaseOfMovementRTIndicator } from "$volume/EaseOfMovementRTIndicator";
import { ElderForceIndexRTIndicator } from "$volume/ElderForceIndexRTIndicator";
import { KlingerOscillatorRTIndicator } from "$volume/KlingerOscillatorRTIndicator";
import { NegativeVolumeIndexRTIndicator } from "$volume/NegativeVolumeIndexRTIndicator";
import { PvtRTIndicator } from "$volume/PvtRTIndicator";
import { expectSeries } from "./compare";

// Holds on a value worked out from the fields of a bar in the momentum and volume indicators that read whole bars.
// Each scenario below makes that value overflow while the fields are finite (a price, a volume or a difference near the
// largest double, or a previous close that is hardly above zero); the expected rows are the ones the Java engine gives
// for the same bars: [value, ready, then the getters named in each test]. A bar is written as the fields the class
// reads, and the fields it does not read are 0. Then the cases that are left unguarded on purpose, where the value
// worked out is only returned.

const MAX = Number.MAX_VALUE;

type Fields = "hl" | "ohlc" | "hlc" | "hlcv" | "hlv" | "cv" | "x";
interface Scenario {
  /** The fields of each bar, in order; `x` is a single value for the scalar `update`. */
  fields: Fields;
  bars: number[][];
  rows: number[][];
}

const FIELD_NAMES = {
  hl: ["high", "low"],
  ohlc: ["open", "high", "low", "close"],
  hlc: ["high", "low", "close"],
  hlcv: ["high", "low", "close", "volume"],
  hlv: ["high", "low", "volume"],
  cv: ["close", "volume"],
} as const;

type BarIndicator = AbstractRTIndicator & { updateFrom(bar: Kline): void };

function kline(fields: Exclude<Fields, "x">, bar: readonly number[], i: number): Kline {
  const values = { open: 0, high: 0, low: 0, close: 0, volume: 0 };
  FIELD_NAMES[fields].forEach((name, k) => {
    values[name] = bar[k];
  });
  return { instrument: "BTC/USDT", ...values, quoteVolume: 0, numberOfTrades: 1, timestamp: i };
}

/** Feeds the bars (or the values, for the scalar `update`) and reads [value, ready, ...parts] after each. */
function play<T extends BarIndicator>(indicator: T, scenario: Scenario, parts: ((indicator: T) => number)[] = []): number[][] {
  return scenario.bars.map((bar, i) => {
    if (scenario.fields === "x") indicator.update(bar[0]);
    else indicator.updateFrom(kline(scenario.fields, bar, i));
    return [indicator.getValue(), indicator.isReady() ? 1 : 0, ...parts.map((part) => part(indicator))];
  });
}

/** The rows equal Java's, column by column, to the last bit (Object.is: even NaN and the sign of a zero). */
function expectRows(actual: readonly number[][], expected: readonly number[][], label: string): void {
  expect(actual, `${label}: rows`).toHaveLength(expected.length);
  for (let column = 0; column < expected[0].length; column++) {
    expectSeries(actual.map((row) => row[column]), expected.map((row) => row[column]), `${label} column ${column}`);
  }
}

function assertAllFinite(rows: readonly number[][], label: string): void {
  rows.forEach((row, k) => row.forEach((v, c) => expect(Number.isFinite(v), `${label}: row ${k} column ${c}: ${v}`).toBe(true)));
}

const acceleratorMidpointOverflow: Scenario = {
  fields: "hl",
  bars: [[11, 10], [12, 10], [13, 11], [14, 12], [15, 13], [MAX, MAX], [16, 14], [17, 15], [18, 16], [19, 17], [20, 18], [21, 19]],
  rows: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [1.2799999999999998, 0, 1.5999999999999996],
    [1.2799999999999998, 0, 1.5999999999999996],
    [1.2799999999999998, 0, 1.5999999999999996],
    [1.2799999999999998, 0, 1.5999999999999996],
    [1.2799999999999998, 0, 1.5999999999999996],
    [1.2799999999999998, 0, 1.5999999999999996],
    [3.9200000000000004, 0, 6.5],
    [3.9200000000000004, 0, 6.5],
  ],
};

const acceleratorMidpointOverflowAbsent: Scenario = {
  fields: "hl",
  bars: [[11, 10], [12, 10], [13, 11], [14, 12], [15, 13], [16, 14], [17, 15], [18, 16], [19, 17], [20, 18], [21, 19]],
  rows: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [1.2799999999999998, 0, 1.5999999999999996],
    [1.2799999999999998, 0, 1.5999999999999996],
    [1.2799999999999998, 0, 1.5999999999999996],
    [1.2799999999999998, 0, 1.5999999999999996],
    [1.2799999999999998, 0, 1.5999999999999996],
    [3.9200000000000004, 0, 6.5],
    [3.9200000000000004, 0, 6.5],
  ],
};

const acceleratorScalar: Scenario = {
  fields: "x",
  bars: [[10], [12], [MAX], [14], [MAX / 2], [16]],
  rows: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [1.4381545078898525e307, 0, 1.7976931348623158e307],
  ],
};

const awesomeMidpointOverflow: Scenario = {
  fields: "hl",
  bars: [[11, 10], [12, 10], [13, 11], [MAX, MAX], [14, 12], [MAX, -MAX], [15, 13], [16, 14]],
  rows: [
    [0, 0],
    [0.25, 0],
    [-0.4166666666666661, 1],
    [-0.4166666666666661, 1],
    [1.333333333333334, 1],
    [1.333333333333334, 1],
    [-2, 1],
    [-2, 1],
  ],
};

const awesomeMidpointOverflowAbsent: Scenario = {
  fields: "hl",
  bars: [[11, 10], [12, 10], [13, 11], [14, 12], [MAX, -MAX], [15, 13], [16, 14]],
  rows: [
    [0, 0],
    [0.25, 0],
    [-0.4166666666666661, 1],
    [1.333333333333334, 1],
    [1.333333333333334, 1],
    [-2, 1],
    [-2, 1],
  ],
};

const awesomeScalar: Scenario = {
  fields: "x",
  bars: [[-MAX], [MAX], [5], [6], [7]],
  rows: [
    [0, 0],
    [Infinity, 0],
    [3.333333333333333, 1],
    [4.333333333333333, 1],
    [5.333333333333333, 1],
  ],
};

const relativeVigorDifferenceOverflow: Scenario = {
  fields: "ohlc",
  bars: [[10, 12, 9, 11.5], [11, 13, 10, 11.2], [12, 14, 11, 13.7], [13, 15, 12, 13.1], [-MAX, 1, 0, MAX], [0, MAX, -MAX, 0], [14, 16, 13, 15.4], [15, 17, 14, 14.2], [16, 18, 15, 17.9], [17, 19, 16, 16.5]],
  rows: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0.2999999999999998, 0],
    [0.2999999999999998, 0],
    [0.2999999999999998, 0],
    [0.2944444444444443, 1],
    [0.2944444444444443, 1],
    [0.1972222222222221, 1],
    [0.1972222222222221, 1],
  ],
};

const relativeVigorDifferenceOverflowAbsent: Scenario = {
  fields: "ohlc",
  bars: [[10, 12, 9, 11.5], [11, 13, 10, 11.2], [12, 14, 11, 13.7], [13, 15, 12, 13.1], [14, 16, 13, 15.4], [15, 17, 14, 14.2], [16, 18, 15, 17.9], [17, 19, 16, 16.5]],
  rows: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0.2999999999999998, 0],
    [0.2944444444444443, 1],
    [0.2944444444444443, 1],
    [0.1972222222222221, 1],
    [0.1972222222222221, 1],
  ],
};

const relativeVigorWeightedSumOverflow: Scenario = {
  fields: "ohlc",
  bars: [[0, 1, 0, MAX / 4], [0, 1, 0, MAX / 4], [0, 1, 0, MAX / 4], [0, 1, 0, MAX / 4], [0, 1, 0, MAX / 4], [10, 12, 9, 11.5], [11, 13, 10, 11.2], [12, 14, 11, 13.7], [13, 15, 12, 13.1], [14, 16, 13, 15.4]],
  rows: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [1.1235582092889473e307, 0],
    [6.420332624508272e306, 1],
    [6.420332624508272e306, 1],
    [0.2944444444444443, 1],
  ],
};

const stochasticRawKFirstBar: Scenario = {
  fields: "hlc",
  bars: [[1, 0, MAX], [12, 10, 11], [13, 11, 12]],
  rows: [
    [0, 1, 0, 0],
    [50, 1, 50, 50],
    [50, 1, 50, 50],
  ],
};

const stochasticDistanceOverflow: Scenario = {
  fields: "hlc",
  bars: [[12, 10, 11], [13, 10, 12], [1, -MAX, MAX], [14, 11, 13], [15, 12, 14], [16, 13, 15], [17, 14, 16], [18, 15, 17]],
  rows: [
    [50, 0, 50, 50],
    [58.33333333333333, 0, 58.33333333333333, 54.166666666666664],
    [58.33333333333333, 1, 58.33333333333333, 54.166666666666664],
    [58.33333333333333, 1, 58.33333333333333, 54.166666666666664],
    [100, 1, 100, 79.16666666666666],
    [100, 1, 100, 79.16666666666666],
    [80, 1, 80, 90],
    [80, 1, 80, 90],
  ],
};

const stochasticRangeOverflow: Scenario = {
  fields: "hlc",
  bars: [[12, 10, 11], [MAX, -MAX, 0], [13, 11, 12], [14, 12, 13], [15, 13, 14], [16, 14, 15]],
  rows: [
    [50, 0, 50, 50],
    [25, 0, 25, 37.5],
    [25, 1, 25, 37.5],
    [0, 1, 0, 12.5],
    [0, 1, 0, 12.5],
    [75, 1, 75, 37.5],
  ],
};

const ultimateDistanceOverflow: Scenario = {
  fields: "hlc",
  bars: [[11, 9, 10], [12, 10, 11], [13, 11, 12], [14, 12, 13], [15, 13, 14], [16, 14, 15], [17, 15, 16], [18, 16, 17], [MAX, -MAX, 0], [0, -MAX, MAX], [19, 17, 17.5], [20, 18, 19.4], [21, 19, 19.2]],
  rows: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [50, 0],
    [50, 0],
    [50, 0],
    [46.619897959183675, 0],
    [50.93862335241645, 0],
    [46.07953862789858, 0],
  ],
};

const ultimateDistanceOverflowAbsent: Scenario = {
  fields: "hlc",
  bars: [[11, 9, 10], [12, 10, 11], [13, 11, 12], [14, 12, 13], [15, 13, 14], [16, 14, 15], [17, 15, 16], [18, 16, 17], [19, 17, 17.5], [20, 18, 19.4], [21, 19, 19.2]],
  rows: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [50, 0],
    [46.619897959183675, 0],
    [50.93862335241645, 0],
    [46.07953862789858, 0],
  ],
};

const ultimateSumsNotFinite: Scenario = {
  fields: "hlc",
  bars: [[1e308, 0, 1e308], [1e308, 0, 1e308], [1e308, 0, 1e308], [1e308, 0, 1e308], [1e308, 0, 1e308], [1e308, 0, 1e308], [1e308, 0, 1e308], [1e308, 0, 1e308], [1e308, 0, 1e308], [1e308, 0, 1e308], [1e308, 0, 1e308]],
  rows: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [NaN, 0],
    [NaN, 0],
    [NaN, 0],
    [NaN, 0],
  ],
};

const williamsRNotFinite: Scenario = {
  fields: "hlc",
  bars: [[12, 10, 11], [MAX, 0, -MAX], [13, 11, 12], [MAX, -MAX, 0], [14, 12, 13], [15, 13, 14]],
  rows: [
    [-50, 0],
    [-Infinity, 0],
    [-100, 1],
    [-0, 1],
    [-0, 1],
    [-0, 1],
  ],
};

const balanceOfPowerNotFinite: Scenario = {
  fields: "ohlc",
  bars: [[-MAX, 1, 0, MAX], [10, 12, 9, 11], [0, 1e-300, 0, 10000000000], [10, 12, 9, 11]],
  rows: [
    [Infinity, 1],
    [0.3333333333333333, 1],
    [Infinity, 1],
    [0.3333333333333333, 1],
  ],
};

const bullBearPowerNotFinite: Scenario = {
  fields: "hlc",
  bars: [[1, 0, -MAX], [MAX, -MAX, 0], [12, 10, 11], [13, 11, 12]],
  rows: [
    [Infinity, 0, MAX, MAX],
    [Infinity, 0, Infinity, -MAX / 2],
    [MAX / 2, 1, MAX / 4, MAX / 4],
    [MAX / 4, 1, 2.2471164185778946e307, 2.2471164185778946e307],
  ],
};

const adlOverflow: Scenario = {
  fields: "hlcv",
  bars: [[1, 0, 2, MAX], [12, 10, 11, 100], [12, 10, 12, MAX], [12, 10, 12, MAX], [12, 10, 10, MAX], [12, 10, 11, 100], [13, 11, 12, 50]],
  rows: [
    [0, 0],
    [0, 1],
    [MAX, 1],
    [MAX, 1],
    [0, 1],
    [0, 1],
    [0, 1],
  ],
};

const chaikinHeldAdl: Scenario = {
  fields: "hlcv",
  bars: [[1, 0, 2, MAX], [12, 10, 11, 100], [12, 10, 12, MAX], [12, 10, 12, MAX], [12, 10, 10, MAX], [12, 10, 11, 100], [13, 11, 12, 50]],
  rows: [
    [0, 0],
    [0, 0],
    [2.996155224770525e307, 1],
    [2.4967960206421045e307, 1],
    [-1.414851078363859e307, 1],
    [-1.5951752354102336e307, 1],
    [-1.0935041831145514e307, 1],
  ],
};

const easeOfMovementOverflow: Scenario = {
  fields: "hlv",
  bars: [[11, 9, 100], [21, 19, 1e-310], [21, 19, 5e-324], [22, 20, 100], [23, 21, 100], [24, 22, 100]],
  rows: [
    [0, 0],
    [0, 0],
    [0, 0],
    [100, 1],
    [200, 1],
    [200, 1],
  ],
};

const easeOfMovementOverflowAbsent: Scenario = {
  fields: "hlv",
  bars: [[11, 9, 100], [21, 19, 5e-324], [22, 20, 100], [23, 21, 100], [24, 22, 100]],
  rows: [
    [0, 0],
    [0, 0],
    [100, 1],
    [200, 1],
    [200, 1],
  ],
};

const easeOfMovementSumOverflow: Scenario = {
  fields: "hlv",
  bars: [[1, 0, 1e-296], [100000001, 100000000, 1e-296], [200000001, 200000000, 1e-296], [200000002, 200000001, 1], [200000003, 200000002, 1]],
  rows: [
    [0, 0],
    [1e308, 0],
    [1e308, 0],
    [5e307, 1],
    [5000, 1],
  ],
};

const easeOfMovementStuck: Scenario = {
  fields: "hlv",
  bars: [[10, 8, 100], [MAX, MAX, 100], [11, 9, 100], [12, 10, 100], [MAX, MAX, 100]],
  rows: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 1],
  ],
};

const elderForceOverflow: Scenario = {
  fields: "cv",
  bars: [[10, 100], [11, MAX], [12.5, MAX], [11.5, 1000], [MAX, 0], [-MAX, 0], [5, 10], [MAX, 3]],
  rows: [
    [0, 0],
    [MAX, 0],
    [MAX, 0],
    [MAX / 2, 0],
    [MAX / 4, 1],
    [MAX / 4, 1],
    [MAX / 4, 1],
    [2.2471164185778946e307, 1],
  ],
};

const elderForceOverflowAbsent: Scenario = {
  fields: "cv",
  bars: [[10, 100], [11, MAX], [11.5, 1000], [MAX, 0], [-MAX, 0], [5, 10], [MAX, 3]],
  rows: [
    [0, 0],
    [MAX, 0],
    [MAX / 2, 0],
    [MAX / 4, 1],
    [MAX / 4, 1],
    [MAX / 4, 1],
    [2.2471164185778946e307, 1],
  ],
};

const klingerSumAndRangeOverflow: Scenario = {
  fields: "hlcv",
  bars: [[MAX, MAX, MAX, 100], [MAX, -MAX, 0, 100], [12, 10, 11, 100], [13, 11, 12, 100], [14, 12, 13, 100], [11, 9, 10, 100], [12, 10, 11, 100]],
  rows: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [71.42857142857143, 0, 10.204081632653061],
    [-149.4897959183674, 0, -12.609329446064148],
    [78.53134110787164, 0, 0.4107663473552492],
  ],
};

const klingerSumAndRangeOverflowAbsent: Scenario = {
  fields: "hlcv",
  bars: [[12, 10, 11, 100], [13, 11, 12, 100], [14, 12, 13, 100], [11, 9, 10, 100], [12, 10, 11, 100]],
  rows: [
    [0, 0, 0],
    [0, 0, 0],
    [71.42857142857143, 0, 10.204081632653061],
    [-149.4897959183674, 0, -12.609329446064148],
    [78.53134110787164, 0, 0.4107663473552492],
  ],
};

const klingerRunningRangeOverflow: Scenario = {
  fields: "hlcv",
  bars: [[8e307, 0, 1e300, 100], [8e307, 0, 2e300, 100], [8e307, 0, 3e300, 100], [8e307, 0, 4e300, 100], [8e307, 0, 5e299, 100], [8e307, 0, 6e299, 100], [8e307, 0, 7e299, 100]],
  rows: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [-214.28571428571433, 0, -30.61224489795919],
    [19.897959183673436, 0, -23.39650145772596],
    [18.48760932944603, 0, -17.413057059558533],
  ],
};

const klingerForceOverflow: Scenario = {
  fields: "hlcv",
  bars: [[12, 10, 11, 100], [11, 9, 10, 100], [13, 11, 12, 100], [12, 10, 11, MAX], [14, 12, 13, 100], [12, 10, 11, 100], [14, 12, 13, 100], [12, 10, 11, 100]],
  rows: [
    [0, 0, 0],
    [0, 0, 0],
    [428.57142857142935, 0, 61.22448979591847],
    [428.57142857142935, 0, 61.22448979591847],
    [603.0612244897966, 0, 138.62973760932965],
    [546.1880466472303, 0, 196.8523531861726],
    [921.9366409829245, 0, 300.43582287142283],
    [833.1081963616361, 0, 376.5318762271676],
  ],
};

const klingerAverageOverflow: Scenario = {
  fields: "hlcv",
  bars: [[12, 10, 11, 1e306], [11, 9, 10, 1e306], [13, 11, 12, 1e306], [12, 10, 11, 100], [13, 11, 12, 100], [12, 10, 11, 100]],
  rows: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [2.1428571428571463e306, 0, 3.0612244897959233e305],
    [4.0867346938775596e306, 0, 8.462099125364448e305],
    [5.845736151603515e306, 0, 1.5604279466888833e306],
  ],
};

const negativeVolumeIndexSubnormalPrevClose: Scenario = {
  fields: "cv",
  bars: [[10, 100], [12, 50], [1e-310, 60], [100, 40], [200, 30], [100, 70], [50, 60], [55, 50]],
  rows: [
    [1000, 1],
    [1200, 1],
    [1200, 1],
    [1200, 1],
    [1200, 1],
    [1200, 1],
    [600, 1],
    [660, 1],
  ],
};

const pvtSubnormalPrevClose: Scenario = {
  fields: "cv",
  bars: [[10, 100], [20, 5], [1e-310, 7], [100, 5], [50, 10], [1e-310, 3], [20, 1]],
  rows: [
    [0, 1],
    [5, 1],
    [-2, 1],
    [-2, 1],
    [-2, 1],
    [-2, 1],
    [-2, 1],
  ],
};

const pvtSumOverflow: Scenario = {
  fields: "cv",
  bars: [[10, 100], [20, MAX], [40, MAX], [10, 1]],
  rows: [
    [0, 1],
    [MAX, 1],
    [MAX, 1],
    [MAX, 1],
  ],
};

describe("a value worked out from finite fields that overflows, in the momentum indicators", () => {
  const ao = [(i: AcceleratorOscillatorRTIndicator) => i.getAO()];

  it("Accelerator Oscillator holds when the midpoint overflows, and the bar leaves no trace", () => {
    const rows = play(new AcceleratorOscillatorRTIndicator(), acceleratorMidpointOverflow, ao);
    expectRows(rows, acceleratorMidpointOverflow.rows, "Accelerator midpoint overflow");
    expect(rows[5]).toEqual(rows[4]);
    // the bar is not counted by any average: the bars after it give what they give without it
    const without = play(new AcceleratorOscillatorRTIndicator(), acceleratorMidpointOverflowAbsent, ao);
    expectRows(without, acceleratorMidpointOverflowAbsent.rows, "Accelerator without the bar");
    expect(rows.slice(6)).toEqual(without.slice(5));
  });

  it("Accelerator Oscillator takes the scalar update as a bar with every field the same: a value whose midpoint overflows is held", () => {
    const rows = play(new AcceleratorOscillatorRTIndicator(), acceleratorScalar, ao);
    expectRows(rows, acceleratorScalar.rows, "Accelerator scalar");
    // MAX is held, MAX / 2 is not: its midpoint is MAX / 2
    expect(rows[2]).toEqual(rows[1]);
    expect(rows[5][2]).toBeGreaterThan(1e307);
  });

  it("Awesome Oscillator holds when the midpoint overflows, and a huge but finite range is not a hold", () => {
    const rows = play(new AwesomeOscillatorRTIndicator(2, 3), awesomeMidpointOverflow);
    expectRows(rows, awesomeMidpointOverflow.rows, "Awesome midpoint overflow");
    expect(rows[3]).toEqual(rows[2]); // high and low at MAX: the sum overflows
    // high at MAX and low at -MAX: the midpoint is 0, and the bar counts
    const without = play(new AwesomeOscillatorRTIndicator(2, 3), awesomeMidpointOverflowAbsent);
    expectRows(without, awesomeMidpointOverflowAbsent.rows, "Awesome without the bar");
    expect(rows.slice(4)).toEqual(without.slice(3));
  });

  it("Awesome Oscillator takes the argument of the scalar update as the midpoint itself, so it accepts what a bar cannot give", () => {
    const rows = play(new AwesomeOscillatorRTIndicator(1, 3), awesomeScalar);
    expectRows(rows, awesomeScalar.rows, "Awesome scalar");
    // -MAX then MAX: the fast average is MAX and the slow one still -MAX, so the difference overflows and is returned
    expect(rows[1][0]).toBe(Infinity);
    // a bar with high and low at MAX (or -MAX) has no such midpoint: both are held, and the value stays 0
    const bar = new AwesomeOscillatorRTIndicator(1, 3);
    bar.updateFrom(kline("hl", [-MAX, -MAX], 0));
    bar.updateFrom(kline("hl", [MAX, MAX], 1));
    expect([bar.getValue(), bar.isReady()]).toEqual([0, false]);
    const scalar = new AwesomeOscillatorRTIndicator(1, 3);
    scalar.update(-MAX);
    scalar.update(MAX);
    expect(scalar.getValue()).toBe(Infinity);
  });

  it("Relative Vigor Index holds when a difference overflows, and the bar leaves no trace", () => {
    const rows = play(new RelativeVigorIndexRTIndicator(2), relativeVigorDifferenceOverflow);
    expectRows(rows, relativeVigorDifferenceOverflow.rows, "Relative Vigor difference overflow");
    expect(rows[4]).toEqual(rows[3]); // close - open overflows
    expect(rows[5]).toEqual(rows[3]); // high - low overflows
    const without = play(new RelativeVigorIndexRTIndicator(2), relativeVigorDifferenceOverflowAbsent);
    expectRows(without, relativeVigorDifferenceOverflowAbsent.rows, "Relative Vigor without the bars");
    expect(rows.slice(6)).toEqual(without.slice(4));
  });

  it("Relative Vigor Index holds when a weighted sum overflows, but the bar is in the buffers and neither average is fed", () => {
    const rows = play(new RelativeVigorIndexRTIndicator(2), relativeVigorWeightedSumOverflow);
    expectRows(rows, relativeVigorWeightedSumOverflow.rows, "Relative Vigor weighted sum overflow");
    // the fourth and fifth bars fill the buffers and are held: the value is the 0 of the bars before
    expect(rows.slice(0, 6).map((row) => row[0])).toEqual([0, 0, 0, 0, 0, 0]);
    // the buffers keep the huge bars for a while: the first average is fed only when the sums are finite again
    expect(rows[6][0]).toBeGreaterThan(1e307);
    assertAllFinite(rows, "Relative Vigor weighted sum overflow");
  });

  it("Stochastic Oscillator holds when the raw %K overflows, though the bar is in the windows: it can be ready with nothing computed", () => {
    const parts = [(i: StochasticOscillatorRTIndicator) => i.getPercentK(), (i: StochasticOscillatorRTIndicator) => i.getPercentD()];
    const first = play(new StochasticOscillatorRTIndicator(1, 1, 1), stochasticRawKFirstBar, parts);
    expectRows(first, stochasticRawKFirstBar.rows, "Stochastic raw %K overflow on the first bar");
    expect(first[0]).toEqual([0, 1, 0, 0]); // ready, and both lines still 0
    const rows = play(new StochasticOscillatorRTIndicator(3, 2, 2), stochasticDistanceOverflow, parts);
    expectRows(rows, stochasticDistanceOverflow.rows, "Stochastic distance overflow");
    const lines = (row: readonly number[]): number[] => [row[0], ...row.slice(2)];
    expect(lines(rows[2])).toEqual(lines(rows[1])); // the value and both lines are those of the bar before
    expect(rows[1][1]).toBe(0);
    expect(rows[2][1]).toBe(1); // the third bar made the window full
  });

  it("Stochastic Oscillator: a range that overflows gives a raw %K of 0 and not a hold", () => {
    const parts = [(i: StochasticOscillatorRTIndicator) => i.getPercentK(), (i: StochasticOscillatorRTIndicator) => i.getPercentD()];
    const rows = play(new StochasticOscillatorRTIndicator(3, 2, 2), stochasticRangeOverflow, parts);
    expectRows(rows, stochasticRangeOverflow.rows, "Stochastic range overflow");
    assertAllFinite(rows, "Stochastic range overflow");
  });

  it("Ultimate Oscillator holds when the buying pressure or the true range overflows, and keeps the previous close as the reference", () => {
    const rows = play(new UltimateOscillatorRTIndicator(), ultimateDistanceOverflow);
    expectRows(rows, ultimateDistanceOverflow.rows, "Ultimate distance overflow");
    expect(rows[8]).toEqual(rows[7]); // the true range overflows
    expect(rows[9]).toEqual(rows[7]); // the buying pressure overflows
    const without = play(new UltimateOscillatorRTIndicator(), ultimateDistanceOverflowAbsent);
    expectRows(without, ultimateDistanceOverflowAbsent.rows, "Ultimate without the bars");
    expect(rows.slice(10)).toEqual(without.slice(8));
  });
});

describe("a value worked out from finite fields that overflows, in the volume indicators", () => {
  it("ADL holds when the running sum overflows, and is not ready if the first bar is the one that overflows", () => {
    const rows = play(new AdlRTIndicator(), adlOverflow);
    expectRows(rows, adlOverflow.rows, "ADL overflow");
    // the first bar's term is 3 * MAX: held, so the indicator is still not ready and still 0
    expect(rows[0]).toEqual([0, 0]);
    expect(rows[1]).toEqual([0, 1]);
    // MAX, then MAX again: the sum would be 2 * MAX; held, and the bar after that brings the sum back to 0
    expect(rows[2]).toEqual([MAX, 1]);
    expect(rows[3]).toEqual(rows[2]);
    expect(rows[4][0]).toBe(0);
  });

  it("Chaikin Oscillator feeds both EMAs the value the ADL held, so the bar that the ADL leaves out still counts for them", () => {
    const rows = play(new ChaikinOscillatorRTIndicator(2, 3), chaikinHeldAdl);
    expectRows(rows, chaikinHeldAdl.rows, "Chaikin held ADL");
    // the first bar is held by the ADL: the EMAs take its value, 0, and the slow one (3 periods) is ready after three bars, not four
    expect(rows.map((row) => row[1])).toEqual([0, 0, 1, 1, 1, 1, 1]);
    assertAllFinite(rows, "Chaikin held ADL");
  });

  it("Ease of Movement holds when the EMV overflows, keeps the previous bar as the reference, and takes a tiny volume as no EMV", () => {
    const rows = play(new EaseOfMovementRTIndicator(2), easeOfMovementOverflow);
    expectRows(rows, easeOfMovementOverflow.rows, "Ease of Movement overflow");
    expect(rows[1]).toEqual(rows[0]); // a volume of 1e-310 makes the box ratio hardly above 0: the EMV is not finite
    // a volume of 5e-324 makes the box ratio exactly 0, which gives an EMV of 0 and counts
    const without = play(new EaseOfMovementRTIndicator(2), easeOfMovementOverflowAbsent);
    expectRows(without, easeOfMovementOverflowAbsent.rows, "Ease of Movement without the bar");
    expect(rows.slice(2)).toEqual(without.slice(1));
  });

  it("Ease of Movement holds when the running sum overflows, and the sum keeps what it absorbed", () => {
    const rows = play(new EaseOfMovementRTIndicator(2), easeOfMovementSumOverflow);
    expectRows(rows, easeOfMovementSumOverflow.rows, "Ease of Movement sum overflow");
    expect(rows[1][0]).toBe(1e308);
    expect(rows[2]).toEqual(rows[1]); // 1e308 + 1e308 does not fit
    assertAllFinite(rows, "Ease of Movement sum overflow");
  });

  it("Ease of Movement is stuck when a previous bar at the largest double makes every distance not finite, until another bar with no range", () => {
    const rows = play(new EaseOfMovementRTIndicator(2), easeOfMovementStuck);
    expectRows(rows, easeOfMovementStuck.rows, "Ease of Movement stuck");
    expect(rows[2]).toEqual(rows[1]);
    expect(rows[3]).toEqual(rows[1]);
    expect(rows[4]).toEqual([0, 1]);
  });

  it("Elder Force Index holds when the force overflows, including 0 times a difference that overflows, and keeps the previous close", () => {
    const rows = play(new ElderForceIndexRTIndicator(3), elderForceOverflow);
    expectRows(rows, elderForceOverflow.rows, "Elder Force overflow");
    expect(rows[2]).toEqual(rows[1]); // 1.5 * MAX
    expect(rows[5]).toEqual(rows[4]); // (-MAX - MAX) * 0 is NaN
    expect(rows[6]).toEqual(rows[4]); // (5 - MAX) * 10
    const without = play(new ElderForceIndexRTIndicator(3), elderForceOverflowAbsent);
    expectRows(without, elderForceOverflowAbsent.rows, "Elder Force without the bar");
    expect(rows.slice(3)).toEqual(without.slice(2));
  });

  it("Klinger Oscillator holds when the sum of the prices or the range overflows, and the bars leave no trace", () => {
    const signal = [(i: KlingerOscillatorRTIndicator) => i.getSignal()];
    const rows = play(new KlingerOscillatorRTIndicator(), klingerSumAndRangeOverflow, signal);
    expectRows(rows, klingerSumAndRangeOverflow.rows, "Klinger sum and range overflow");
    const without = play(new KlingerOscillatorRTIndicator(), klingerSumAndRangeOverflowAbsent, signal);
    expectRows(without, klingerSumAndRangeOverflowAbsent.rows, "Klinger without the bars");
    // the held bars come first: the next bar is the first one of the indicator
    expect(rows.slice(2)).toEqual(without);
  });

  it("Klinger Oscillator holds when the running range overflows, and a change of trend starts it again", () => {
    const signal = [(i: KlingerOscillatorRTIndicator) => i.getSignal()];
    const rows = play(new KlingerOscillatorRTIndicator(), klingerRunningRangeOverflow, signal);
    expectRows(rows, klingerRunningRangeOverflow.rows, "Klinger running range overflow");
    expect(rows[2]).toEqual(rows[1]);
    expect(rows[3]).toEqual(rows[1]);
    expect(rows[4][0]).not.toBe(0);
    assertAllFinite(rows, "Klinger running range overflow");
  });

  it("Klinger Oscillator holds when the volume force overflows", () => {
    const signal = [(i: KlingerOscillatorRTIndicator) => i.getSignal()];
    const rows = play(new KlingerOscillatorRTIndicator(), klingerForceOverflow, signal);
    expectRows(rows, klingerForceOverflow.rows, "Klinger force overflow");
    expect(rows[3]).toEqual(rows[2]);
    assertAllFinite(rows, "Klinger force overflow");
  });

  it("Klinger Oscillator holds when an average overflows, and the averages keep their last values", () => {
    const signal = [(i: KlingerOscillatorRTIndicator) => i.getSignal()];
    const rows = play(new KlingerOscillatorRTIndicator(), klingerAverageOverflow, signal);
    expectRows(rows, klingerAverageOverflow.rows, "Klinger average overflow");
    // the force of the third bar is 1e308 against -1e308: the gap to the average is 2e308
    expect(rows[2]).toEqual(rows[1]);
    assertAllFinite(rows, "Klinger average overflow");
  });

  it("Negative Volume Index holds when the move from a previous close that is hardly above 0 overflows, and keeps that close", () => {
    const rows = play(new NegativeVolumeIndexRTIndicator(), negativeVolumeIndexSubnormalPrevClose);
    expectRows(rows, negativeVolumeIndexSubnormalPrevClose.rows, "Negative Volume Index subnormal previous close");
    // volume falls, and the previous close is 1e-310: the index would be infinite
    expect(rows[3]).toEqual(rows[2]);
    expect(rows[4]).toEqual(rows[2]);
    // a bar whose volume does not fall is taken, and its close becomes the reference
    expect(rows[6][0]).toBe(600);
    assertAllFinite(rows, "Negative Volume Index subnormal previous close");
  });

  it("PVT holds when the move from a previous close that is hardly above 0 overflows, and keeps that close", () => {
    const rows = play(new PvtRTIndicator(), pvtSubnormalPrevClose);
    expectRows(rows, pvtSubnormalPrevClose.rows, "PVT subnormal previous close");
    expect(rows.map((row) => row[0])).toEqual([0, 5, -2, -2, -2, -2, -2]);
  });

  it("PVT holds when the running sum overflows, and the bar after it counts from the previous close", () => {
    const rows = play(new PvtRTIndicator(), pvtSumOverflow);
    expectRows(rows, pvtSumOverflow.rows, "PVT sum overflow");
    expect(rows[2]).toEqual(rows[1]);
    expect(rows[3][0]).toBe(MAX); // MAX - 0.5 is MAX
  });
});

// What stays unguarded on purpose: the value worked out is only returned, or it goes into a state the bar cannot
// corrupt. These pin the Java behaviour so that a later change is deliberate.

describe("what is left unguarded on purpose, in the momentum and volume indicators", () => {
  it("the Ultimate Oscillator sums are returned: seven huge distances give NaN, and the buffers keep them", () => {
    const rows = play(new UltimateOscillatorRTIndicator(), ultimateSumsNotFinite);
    expectRows(rows, ultimateSumsNotFinite.rows, "Ultimate sums not finite");
    expect(rows.slice(0, 7).map((row) => row[0])).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(rows.slice(7).every((row) => Number.isNaN(row[0]))).toBe(true);
  });

  it("Williams %R is a returned ratio: a close far below the highest high gives -Infinity, and a range that overflows gives -0", () => {
    const rows = play(new WilliamsRRTIndicator(3), williamsRNotFinite);
    expectRows(rows, williamsRNotFinite.rows, "Williams %R not finite");
    expect(rows[1][0]).toBe(-Infinity);
    expect(Object.is(rows[3][0], -0)).toBe(true);
    // the next bar is a number again, from the window
    expect(Object.is(rows[2][0], -100)).toBe(true);
  });

  it("Balance of Power is a returned ratio: a move or a range that overflows gives Infinity, and the indicator is ready", () => {
    const rows = play(new BalanceOfPowerRTIndicator(), balanceOfPowerNotFinite);
    expectRows(rows, balanceOfPowerNotFinite.rows, "Balance of Power not finite");
    expect(rows[0]).toEqual([Infinity, 1]);
    expect(rows[2][0]).toBe(Infinity);
    expect(rows[3][0]).toBeCloseTo(1 / 3, 15);
  });

  it("Bull Bear Power returns what the EMA leaves: a high far above the EMA gives powers that are not finite", () => {
    const parts = [(i: BullBearPowerRTIndicator) => i.getBullPower(), (i: BullBearPowerRTIndicator) => i.getBearPower()];
    const rows = play(new BullBearPowerRTIndicator(3), bullBearPowerNotFinite, parts);
    expectRows(rows, bullBearPowerNotFinite.rows, "Bull Bear Power not finite");
    expect(rows[0][0]).toBe(Infinity);
    expect(rows[1][2]).toBe(Infinity);
    // the EMA took the closes: later bars are finite again
    assertAllFinite(rows.slice(2), "Bull Bear Power after the huge bars");
  });
});
