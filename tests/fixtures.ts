import { readFileSync } from "node:fs";
import type { Kline } from "@qtsurfer/core";

/** The expected values of the ported indicators, written by the Java engine (tools/java-oracle). */
export interface Reference {
  bars: number;
  inputs: Record<"price" | "open" | "high" | "low" | "close" | "volume", number[]>;
  poisons: { bar: number; field: string; value: "NaN" | "Infinity" | "-Infinity" }[];
  scenarios: Record<"clean" | "corrupt", Expected>;
  /** Short synthetic price series, and what every price-fed indicator gives on each. */
  edges: Record<string, EdgeExpected>;
  /** Synthetic series of bars, and what every indicator that reads whole bars gives on each. */
  barEdges: Record<string, BarEdgeExpected>;
  /** What each call of `facade-calls.txt` registers on an empty group through the Java engine's `Pro`. */
  facade: Record<string, FacadeExpected>;
}

/** The result of one call: the indicators it registers, or that it throws, or that the Java build has no such factory. */
export type FacadeExpected =
  | { registered: Record<string, { hint: string; meta: Record<string, string> }> }
  | { throws: true }
  | { missing: true };

/**
 * A value of a series as the oracle writes it: a number, or `null` or a string for one that is not finite.
 * The series of the edge cases, and those of the scenarios that `subjects.ts` lists, keep NaN, Infinity and
 * -Infinity apart as strings: an indicator that does not leave a non-finite price out can give any of them. The
 * older series, the fields of `Expected`, write null.
 */
export type Encoded = number | null | "NaN" | "Infinity" | "-Infinity";

/** The series of an indicator by output: `value` is what `update` returns, the others are its getters. */
export type SeriesSet = Record<string, Encoded[]>;

export interface EdgeExpected {
  price: number[];
  /** By the key of the indicator and its parameters; `{ throws }` when the Java indicator threw. */
  series: Record<string, SeriesSet | { throws: string }>;
}

/** A synthetic series of bars, written as inputs (a field that is not finite is a string), and the series of the bar-fed indicators on it. */
export interface BarEdgeExpected {
  open: Encoded[];
  high: Encoded[];
  low: Encoded[];
  close: Encoded[];
  volume: Encoded[];
  /** By the key of the indicator and its parameters; `{ throws }` when the Java indicator threw. */
  series: Record<string, SeriesSet | { throws: string }>;
}

/** The values of Value at Risk and the z-score its confidence level turns into. */
export interface ValueAtRiskExpected {
  value: (number | null)[];
  meanReturn: (number | null)[];
  stdDev: (number | null)[];
  zScore: number;
}

export interface Expected {
  kurtosis20: (number | null)[];
  vwap: (number | null)[];
  adx14: Record<"main" | "plusDI" | "minusDI", (number | null)[]>;
  ichimoku: Record<"tenkan" | "kijun" | "senkouA" | "senkouB" | "chikou", (number | null)[]>;
  yangZhang20: (number | null)[];
  /** Not ported here: ATR is a free indicator. Java's values stay to check the open engine's `AtrRTIndicator` against them. */
  atr14: (number | null)[];
  obv: (number | null)[];
  mfi14: (number | null)[];
  cmf20: (number | null)[];
  superTrend: Record<"main" | "upper" | "lower", (number | null)[]>;
  parkinson20: (number | null)[];
  garmanKlass20: (number | null)[];
  rogersSatchell20: (number | null)[];
  autocorrelation20: Record<"value" | "pairCount", (number | null)[]>;
  hurst20: (number | null)[];
  linearRegressionSlope20: Record<"slope" | "intercept" | "mean" | "forecast5", (number | null)[]>;
  rollingPercentile20: Record<"value" | "median" | "min" | "max", (number | null)[]>;
  simpleLinearRegression20: Record<"slope" | "intercept" | "rSquared" | "standardError" | "mean" | "forecast5", (number | null)[]>;
  skewness20: Record<"value" | "mean", (number | null)[]>;
  valueAtRisk20: ValueAtRiskExpected;
  valueAtRisk20Confidence99Annualized252: ValueAtRiskExpected;
  /** The z-score of each confidence level (the key), from the inverse normal CDF. */
  valueAtRiskZScores: Record<string, number>;
  zScore20: Record<"value" | "mean" | "stdDev", (number | null)[]>;
  variance20: Record<"value" | "mean", (number | null)[]>;
  sampleVariance20: Record<"value" | "mean", (number | null)[]>;
}

/** The series of a price-fed indicator of a scenario that the oracle writes with the key `key`. */
export function seriesOf(expected: Expected, key: string): SeriesSet {
  const series = (expected as unknown as Record<string, SeriesSet | undefined>)[key];
  if (!series) throw new Error(`reference.json has no series ${key}`);
  return series;
}

export const reference: Reference = JSON.parse(readFileSync(new URL("./fixtures/reference.json", import.meta.url), "utf8"));

const POISON_VALUES = { NaN, Infinity, "-Infinity": -Infinity } as const;

/** The inputs of a scenario: the clean ones, or those with the values that are not finite put in. */
export function inputsOf(scenario: "clean" | "corrupt"): Reference["inputs"] {
  const inputs = Object.fromEntries(Object.entries(reference.inputs).map(([k, v]) => [k, [...v]])) as Reference["inputs"];
  if (scenario === "corrupt") {
    for (const poison of reference.poisons) {
      inputs[poison.field as keyof Reference["inputs"]][poison.bar] = POISON_VALUES[poison.value];
    }
  }
  return inputs;
}

export function klines(inputs: Reference["inputs"]): Kline[] {
  return inputs.close.map((close, i) => ({
    instrument: "BTC/USDT",
    open: inputs.open[i],
    high: inputs.high[i],
    low: inputs.low[i],
    close,
    volume: inputs.volume[i],
    quoteVolume: inputs.volume[i] * close,
    numberOfTrades: 5,
    timestamp: i * 60_000 + 59_999,
  }));
}
