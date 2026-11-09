import { expect } from "vitest";
import { AutocorrelationRTIndicator } from "$statistics/AutocorrelationRTIndicator";
import { HurstExponentRTIndicator } from "$statistics/HurstExponentRTIndicator";
import { KurtosisRTIndicator } from "$statistics/KurtosisRTIndicator";
import { LinearRegressionSlopeRTIndicator } from "$statistics/LinearRegressionSlopeRTIndicator";
import { RollingPercentileRTIndicator } from "$statistics/RollingPercentileRTIndicator";
import { SimpleLinearRegressionRTIndicator } from "$statistics/SimpleLinearRegressionRTIndicator";
import { SkewnessRTIndicator } from "$statistics/SkewnessRTIndicator";
import { ValueAtRiskRTIndicator } from "$statistics/ValueAtRiskRTIndicator";
import { VarianceRTIndicator } from "$statistics/VarianceRTIndicator";
import { ZScoreRTIndicator } from "$statistics/ZScoreRTIndicator";
import { CalmarRatioRTIndicator } from "$statistics/ratios/CalmarRatioRTIndicator";
import { MaxDrawdownRTIndicator } from "$statistics/ratios/MaxDrawdownRTIndicator";
import { OmegaRatioRTIndicator } from "$statistics/ratios/OmegaRatioRTIndicator";
import { SharpeRatioRTIndicator } from "$statistics/ratios/SharpeRatioRTIndicator";
import { SortinoRatioRTIndicator } from "$statistics/ratios/SortinoRatioRTIndicator";
import { TailRatioRTIndicator } from "$statistics/ratios/TailRatioRTIndicator";
import { UlcerIndexRTIndicator } from "$statistics/ratios/UlcerIndexRTIndicator";
import { EwmaVolatilityRTIndicator } from "$statistics/volatility/EwmaVolatilityRTIndicator";
import { RealizedVolatilityRTIndicator } from "$statistics/volatility/RealizedVolatilityRTIndicator";
import { LOG_TOLERANCE, expectSeries } from "./compare";
import type { SeriesSet } from "./fixtures";

/**
 * The indicators that read a single price, each with the parameters the Java oracle gives it
 * (tools/java-oracle/Oracle.java): the series it gives on a price series, by output. `value` is what
 * `update` returns, the other outputs are its getters read after each tick.
 */
export interface Subject {
  /** The key of the series in `reference.json`. */
  key: string;
  label: string;
  /** Ported before the ratios: the scenarios compare these in their own tests. */
  earlier: boolean;
  /** 0 when the indicator only uses + - * / and sqrt; `LOG_TOLERANCE` when it takes logarithms. */
  tolerance: number;
  run(prices: readonly number[]): Record<string, number[]>;
}

type Reads<T> = Record<string, (indicator: T) => number>;

function series<T extends { update(price: number): number }>(indicator: T, prices: readonly number[], reads: Reads<T> = {}): Record<string, number[]> {
  const out: Record<string, number[]> = { value: [] };
  for (const name of Object.keys(reads)) out[name] = [];
  for (const price of prices) {
    out.value.push(indicator.update(price));
    for (const [name, read] of Object.entries(reads)) out[name].push(read(indicator));
  }
  return out;
}

const ready = (indicator: { isReady(): boolean }): number => (indicator.isReady() ? 1 : 0);

function subject(key: string, label: string, earlier: boolean, tolerance: number, run: Subject["run"]): Subject {
  return { key, label, earlier, tolerance, run };
}

const SQRT_252 = Math.sqrt(252.0);

export const subjects: Subject[] = [
  subject("kurtosis20", "Kurtosis(20)", true, 0, (p) => series(new KurtosisRTIndicator(20), p, { mean: (i) => i.getMean() })),
  subject("autocorrelation20", "Autocorrelation(20)", true, LOG_TOLERANCE, (p) =>
    series(new AutocorrelationRTIndicator(20), p, { pairCount: (i) => i.getPairCount() }),
  ),
  subject("hurst20", "Hurst(20)", true, LOG_TOLERANCE, (p) => series(new HurstExponentRTIndicator(20), p)),
  subject("linearRegressionSlope20", "LinearRegressionSlope(20)", true, 0, (p) =>
    series(new LinearRegressionSlopeRTIndicator(20), p, {
      intercept: (i) => i.getIntercept(),
      mean: (i) => i.getMean(),
      forecast5: (i) => i.forecast(5),
    }),
  ),
  subject("rollingPercentile20", "RollingPercentile(20, 0.95)", true, 0, (p) =>
    series(new RollingPercentileRTIndicator(20, 0.95), p, {
      median: (i) => i.getMedian(),
      min: (i) => i.getMin(),
      max: (i) => i.getMax(),
    }),
  ),
  subject("simpleLinearRegression20", "SimpleLinearRegression(20)", true, 0, (p) =>
    series(new SimpleLinearRegressionRTIndicator(20), p, {
      slope: (i) => i.getSlope(),
      intercept: (i) => i.getIntercept(),
      rSquared: (i) => i.getRSquared(),
      standardError: (i) => i.getStandardError(),
      mean: (i) => i.getMean(),
      forecast5: (i) => i.forecast(5),
    }),
  ),
  subject("skewness20", "Skewness(20)", true, 0, (p) => series(new SkewnessRTIndicator(20), p, { mean: (i) => i.getMean() })),
  subject("valueAtRisk20", "ValueAtRisk(20)", true, LOG_TOLERANCE, (p) =>
    series(new ValueAtRiskRTIndicator(20), p, { meanReturn: (i) => i.getMeanReturn(), stdDev: (i) => i.getStdDev() }),
  ),
  subject("valueAtRisk20Confidence99Annualized252", "ValueAtRisk(20) at 99% annualized by 252", true, LOG_TOLERANCE, (p) =>
    series(new ValueAtRiskRTIndicator(20).withConfidenceLevel(0.99).withAnnualizationFactor(252.0), p, {
      meanReturn: (i) => i.getMeanReturn(),
      stdDev: (i) => i.getStdDev(),
    }),
  ),
  subject("zScore20", "Z-Score(20)", true, 0, (p) =>
    series(new ZScoreRTIndicator(20), p, { mean: (i) => i.getMean(), stdDev: (i) => i.getStdDev() }),
  ),
  subject("variance20", "Variance(20)", true, 0, (p) => series(new VarianceRTIndicator(20), p, { mean: (i) => i.getMean() })),
  subject("sampleVariance20", "sample Variance(20)", true, 0, (p) =>
    series(new VarianceRTIndicator(20).withSampleVariance(true), p, { mean: (i) => i.getMean() }),
  ),

  subject("calmarRatio20", "Calmar(20)", false, LOG_TOLERANCE, (p) =>
    series(new CalmarRatioRTIndicator(20), p, {
      annualizedReturn: (i) => i.getAnnualizedReturn(),
      maxDrawdown: (i) => i.getMaxDrawdown(),
      ready,
    }),
  ),
  subject("calmarRatio20Annualization365", "Calmar(20) annualized by 365", false, LOG_TOLERANCE, (p) =>
    series(new CalmarRatioRTIndicator(20).withAnnualizationFactor(365.0), p, {
      annualizedReturn: (i) => i.getAnnualizedReturn(),
      maxDrawdown: (i) => i.getMaxDrawdown(),
      ready,
    }),
  ),
  subject("maxDrawdown", "MaxDrawdown", false, 0, (p) =>
    series(new MaxDrawdownRTIndicator(), p, { peak: (i) => i.getPeak(), currentDrawdown: (i) => i.getCurrentDrawdown(), ready }),
  ),
  subject("omegaRatio20", "Omega(20)", false, LOG_TOLERANCE, (p) =>
    series(new OmegaRatioRTIndicator(20), p, { sumGains: (i) => i.getSumGains(), sumLosses: (i) => i.getSumLosses(), ready }),
  ),
  subject("omegaRatio20Threshold", "Omega(20) with a threshold of 0.001", false, LOG_TOLERANCE, (p) =>
    series(new OmegaRatioRTIndicator(20).withThreshold(0.001), p, {
      sumGains: (i) => i.getSumGains(),
      sumLosses: (i) => i.getSumLosses(),
      ready,
    }),
  ),
  subject("sharpeRatio20", "Sharpe(20)", false, LOG_TOLERANCE, (p) =>
    series(new SharpeRatioRTIndicator(20), p, { meanReturn: (i) => i.getMeanReturn(), stdDev: (i) => i.getStdDev(), ready }),
  ),
  subject("sharpeRatio20RiskFreeAnnualized", "Sharpe(20) with a risk-free rate of 0.0002, annualized by sqrt(252)", false, LOG_TOLERANCE, (p) =>
    series(new SharpeRatioRTIndicator(20).withRiskFreeRate(0.0002).withAnnualizationFactor(SQRT_252), p, {
      meanReturn: (i) => i.getMeanReturn(),
      stdDev: (i) => i.getStdDev(),
      ready,
    }),
  ),
  subject("sortinoRatio20", "Sortino(20)", false, LOG_TOLERANCE, (p) =>
    series(new SortinoRatioRTIndicator(20), p, {
      meanReturn: (i) => i.getMeanReturn(),
      downsideDeviation: (i) => i.getDownsideDeviation(),
      ready,
    }),
  ),
  subject("sortinoRatio20MarAnnualized", "Sortino(20) with a MAR of 0.001, annualized by sqrt(252)", false, LOG_TOLERANCE, (p) =>
    series(new SortinoRatioRTIndicator(20).withMAR(0.001).withAnnualizationFactor(SQRT_252), p, {
      meanReturn: (i) => i.getMeanReturn(),
      downsideDeviation: (i) => i.getDownsideDeviation(),
      ready,
    }),
  ),
  subject("tailRatio20", "TailRatio(20)", false, LOG_TOLERANCE, (p) =>
    series(new TailRatioRTIndicator(20), p, {
      upperPercentile: (i) => i.getUpperPercentile(),
      lowerPercentile: (i) => i.getLowerPercentile(),
      ready,
    }),
  ),
  subject("tailRatio20Percentiles", "TailRatio(20) with percentiles of 0.9 and 0.1", false, LOG_TOLERANCE, (p) =>
    series(new TailRatioRTIndicator(20).withPercentiles(0.9, 0.1), p, {
      upperPercentile: (i) => i.getUpperPercentile(),
      lowerPercentile: (i) => i.getLowerPercentile(),
      ready,
    }),
  ),
  subject("ulcerIndex20", "UlcerIndex(20)", false, 0, (p) =>
    series(new UlcerIndexRTIndicator(20), p, { maxDrawdownPercent: (i) => i.getMaxDrawdownPercent(), ready }),
  ),
  subject("ewmaVolatilityDefault", "EwmaVolatility() with the default lambda", false, LOG_TOLERANCE, (p) =>
    series(new EwmaVolatilityRTIndicator(), p, { ewmaVariance: (i) => i.getEwmaVariance(), ready }),
  ),
  subject("ewmaVolatilityLambda097Annualized", "EwmaVolatility(0.97) annualized by sqrt(252)", false, LOG_TOLERANCE, (p) =>
    series(new EwmaVolatilityRTIndicator(0.97).withAnnualizationFactor(SQRT_252), p, { ewmaVariance: (i) => i.getEwmaVariance(), ready }),
  ),
  subject("realizedVolatility20", "RealizedVolatility(20)", false, LOG_TOLERANCE, (p) =>
    series(new RealizedVolatilityRTIndicator(20), p, {
      meanReturn: (i) => i.getMeanReturn(),
      realizedVariance: (i) => i.getRealizedVariance(),
      ready,
    }),
  ),
  subject("realizedVolatility20Annualized", "RealizedVolatility(20) annualized by sqrt(365)", false, LOG_TOLERANCE, (p) =>
    series(new RealizedVolatilityRTIndicator(20).withAnnualizationFactor(Math.sqrt(365.0)), p, {
      meanReturn: (i) => i.getMeanReturn(),
      realizedVariance: (i) => i.getRealizedVariance(),
      ready,
    }),
  ),
];

/** Runs a subject on the prices and compares each of its outputs with Java's. */
export function expectSubject(subject: Subject, prices: readonly number[], expected: SeriesSet, label: string): void {
  const actual = subject.run(prices);
  expect(Object.keys(actual).sort(), `${label}: outputs`).toEqual(Object.keys(expected).sort());
  for (const output of Object.keys(expected)) {
    expectSeries(actual[output], expected[output], `${label} ${output}`, subject.tolerance);
  }
}
