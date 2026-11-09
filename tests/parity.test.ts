import { describe, it, expect } from "vitest";
import { AtrRTIndicator } from "@qtsurfer/indicators";
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
import { GarmanKlassVolatilityRTIndicator } from "$statistics/volatility/GarmanKlassVolatilityRTIndicator";
import { ParkinsonVolatilityRTIndicator } from "$statistics/volatility/ParkinsonVolatilityRTIndicator";
import { RogersSatchellVolatilityRTIndicator } from "$statistics/volatility/RogersSatchellVolatilityRTIndicator";
import { YangZhangVolatilityRTIndicator } from "$statistics/volatility/YangZhangVolatilityRTIndicator";
import { AdxRTIndicator } from "$trend/AdxRTIndicator";
import { IchimokuRTIndicator } from "$trend/IchimokuRTIndicator";
import { SuperTrendRTIndicator } from "$trend/SuperTrendRTIndicator";
import { CmfRTIndicator } from "$volume/CmfRTIndicator";
import { MfiRTIndicator } from "$volume/MfiRTIndicator";
import { ObvRTIndicator } from "$volume/ObvRTIndicator";
import { VwapRTIndicator } from "$volume/VwapRTIndicator";
import { expectSeries, LOG_TOLERANCE } from "./compare";
import { inputsOf, klines, reference, seriesOf, type Expected } from "./fixtures";
import { expectSubject, subjects } from "./subjects";

// Each ported indicator against the Java engine's values on the same data: the arithmetic of + - * /
// and sqrt is exact everywhere, so those series are equal to the last bit. The indicators that take
// logarithms or an exponential (the volatility estimators, Autocorrelation, Hurst, Value at Risk, ALMA, FRAMA,
// the Fisher transforms, and every ratio that works on log returns) are held to a relative 1e-12: JavaScript engines
// do not all round a logarithm the way Java's does. See compare.ts.

describe.each(["clean", "corrupt"] as const)("the %s scenario", (scenario) => {
  const inputs = inputsOf(scenario);
  const bars = klines(inputs);
  const expected: Expected = reference.scenarios[scenario];

  it("Kurtosis(20) equals Java's", () => {
    const kurtosis = new KurtosisRTIndicator(20);
    expectSeries(inputs.price.map((p) => kurtosis.update(p)), expected.kurtosis20, "kurtosis20");
  });

  it("Autocorrelation(20) and its pair count equal Java's", () => {
    const autocorrelation = new AutocorrelationRTIndicator(20);
    const value: number[] = [];
    const pairs: number[] = [];
    for (const price of inputs.price) {
      value.push(autocorrelation.update(price));
      pairs.push(autocorrelation.getPairCount());
    }
    expectSeries(value, expected.autocorrelation20.value, "autocorrelation20", LOG_TOLERANCE);
    expectSeries(pairs, expected.autocorrelation20.pairCount, "autocorrelation20 pairCount");
  });

  it("Hurst(20) equals Java's", () => {
    const hurst = new HurstExponentRTIndicator(20);
    expectSeries(inputs.price.map((p) => hurst.update(p)), expected.hurst20, "hurst20", LOG_TOLERANCE);
  });

  it("LinearRegressionSlope(20), its intercept, mean and forecast equal Java's", () => {
    const slope = new LinearRegressionSlopeRTIndicator(20);
    const series: Record<keyof Expected["linearRegressionSlope20"], number[]> = { slope: [], intercept: [], mean: [], forecast5: [] };
    for (const price of inputs.price) {
      series.slope.push(slope.update(price));
      series.intercept.push(slope.getIntercept());
      series.mean.push(slope.getMean());
      series.forecast5.push(slope.forecast(5));
    }
    for (const name of Object.keys(series) as (keyof typeof series)[]) {
      expectSeries(series[name], expected.linearRegressionSlope20[name], `linearRegressionSlope20 ${name}`);
    }
  });

  it("RollingPercentile(20, 0.95), its median, minimum and maximum equal Java's", () => {
    const percentile = new RollingPercentileRTIndicator(20, 0.95);
    const series: Record<keyof Expected["rollingPercentile20"], number[]> = { value: [], median: [], min: [], max: [] };
    for (const price of inputs.price) {
      series.value.push(percentile.update(price));
      series.median.push(percentile.getMedian());
      series.min.push(percentile.getMin());
      series.max.push(percentile.getMax());
    }
    for (const name of Object.keys(series) as (keyof typeof series)[]) {
      expectSeries(series[name], expected.rollingPercentile20[name], `rollingPercentile20 ${name}`);
    }
  });

  it("SimpleLinearRegression(20) and everything it exposes equal Java's", () => {
    const regression = new SimpleLinearRegressionRTIndicator(20);
    const series: Record<keyof Expected["simpleLinearRegression20"], number[]> = {
      slope: [],
      intercept: [],
      rSquared: [],
      standardError: [],
      mean: [],
      forecast5: [],
    };
    for (const price of inputs.price) {
      regression.update(price);
      series.slope.push(regression.getSlope());
      series.intercept.push(regression.getIntercept());
      series.rSquared.push(regression.getRSquared());
      series.standardError.push(regression.getStandardError());
      series.mean.push(regression.getMean());
      series.forecast5.push(regression.forecast(5));
    }
    for (const name of Object.keys(series) as (keyof typeof series)[]) {
      expectSeries(series[name], expected.simpleLinearRegression20[name], `simpleLinearRegression20 ${name}`);
    }
  });

  it("Skewness(20) and its mean equal Java's", () => {
    const skewness = new SkewnessRTIndicator(20);
    const value: number[] = [];
    const mean: number[] = [];
    for (const price of inputs.price) {
      value.push(skewness.update(price));
      mean.push(skewness.getMean());
    }
    expectSeries(value, expected.skewness20.value, "skewness20");
    expectSeries(mean, expected.skewness20.mean, "skewness20 mean");
  });

  it.each([
    ["ValueAtRisk(20)", () => new ValueAtRiskRTIndicator(20), "valueAtRisk20", 0],
    [
      "ValueAtRisk(20) at 99% annualized by 252",
      () => new ValueAtRiskRTIndicator(20).withConfidenceLevel(0.99).withAnnualizationFactor(252.0),
      "valueAtRisk20Confidence99Annualized252",
      LOG_TOLERANCE,
    ],
  ] as const)("%s, its mean, deviation and z-score equal Java's", (label, make, key, zScoreTolerance) => {
    const valueAtRisk = make();
    const series: Record<"value" | "meanReturn" | "stdDev", number[]> = { value: [], meanReturn: [], stdDev: [] };
    for (const price of inputs.price) {
      series.value.push(valueAtRisk.update(price));
      series.meanReturn.push(valueAtRisk.getMeanReturn());
      series.stdDev.push(valueAtRisk.getStdDev());
    }
    for (const name of Object.keys(series) as (keyof typeof series)[]) {
      expectSeries(series[name], expected[key][name], `${label} ${name}`, LOG_TOLERANCE);
    }
    // the default level is a constant of the class, a configured one comes from the inverse normal CDF
    expectSeries([valueAtRisk.getZScore()], [expected[key].zScore], `${label} z-score`, zScoreTolerance);
  });

  it("the z-score of each confidence level of Value at Risk equals Java's", () => {
    const levels = Object.keys(expected.valueAtRiskZScores);
    expect(levels.length).toBeGreaterThan(5);
    for (const level of levels) {
      const z = new ValueAtRiskRTIndicator(2).withConfidenceLevel(Number(level)).getZScore();
      expectSeries([z], [expected.valueAtRiskZScores[level]], `z-score at ${level}`, LOG_TOLERANCE);
    }
  });

  it("Z-Score(20), its mean and deviation equal Java's", () => {
    const zScore = new ZScoreRTIndicator(20);
    const series: Record<keyof Expected["zScore20"], number[]> = { value: [], mean: [], stdDev: [] };
    for (const price of inputs.price) {
      series.value.push(zScore.update(price));
      series.mean.push(zScore.getMean());
      series.stdDev.push(zScore.getStdDev());
    }
    for (const name of Object.keys(series) as (keyof typeof series)[]) {
      expectSeries(series[name], expected.zScore20[name], `zScore20 ${name}`);
    }
  });

  it.each([
    ["Variance(20)", () => new VarianceRTIndicator(20), "variance20"],
    ["sample Variance(20)", () => new VarianceRTIndicator(20).withSampleVariance(true), "sampleVariance20"],
  ] as const)("%s and its mean equal Java's", (label, make, key) => {
    const variance = make();
    const value: number[] = [];
    const mean: number[] = [];
    for (const price of inputs.price) {
      value.push(variance.update(price));
      mean.push(variance.getMean());
    }
    expectSeries(value, expected[key].value, label);
    expectSeries(mean, expected[key].mean, `${label} mean`);
  });

  it.each(subjects.filter((subject) => !subject.earlier).map((subject) => [subject.label, subject] as const))(
    "%s, with everything it exposes, equals Java's",
    (_, subject) => {
      expectSubject(subject, inputs.price, seriesOf(expected, subject.key), subject.key);
    },
  );

  it("VWAP equals Java's", () => {
    const vwap = new VwapRTIndicator();
    const series = bars.map((bar) => {
      vwap.updateFrom(bar);
      return vwap.getValue();
    });
    expectSeries(series, expected.vwap, "vwap");
  });

  it("ADX(14) and its DIs equal Java's", () => {
    const adx = new AdxRTIndicator(14);
    const main: number[] = [];
    const plus: number[] = [];
    const minus: number[] = [];
    for (const bar of bars) {
      adx.updateFrom(bar);
      main.push(adx.getValue());
      plus.push(adx.getPlusDI());
      minus.push(adx.getMinusDI());
    }
    expectSeries(main, expected.adx14.main, "adx14");
    expectSeries(plus, expected.adx14.plusDI, "plusDI");
    expectSeries(minus, expected.adx14.minusDI, "minusDI");
  });

  it("Ichimoku(9, 26, 52) and its four lines equal Java's", () => {
    const ichimoku = new IchimokuRTIndicator(9, 26, 52);
    const series: Record<string, number[]> = { tenkan: [], kijun: [], senkouA: [], senkouB: [], chikou: [] };
    for (const bar of bars) {
      ichimoku.updateFrom(bar);
      series.tenkan.push(ichimoku.getValue());
      series.kijun.push(ichimoku.getKijunSen());
      series.senkouA.push(ichimoku.getSenkouSpanA());
      series.senkouB.push(ichimoku.getSenkouSpanB());
      series.chikou.push(ichimoku.getChikouSpan());
    }
    for (const line of Object.keys(series) as (keyof Expected["ichimoku"])[]) {
      expectSeries(series[line], expected.ichimoku[line], `ichimoku ${line}`);
    }
  });

  it("Yang-Zhang(20) equals Java's", () => {
    const yangZhang = new YangZhangVolatilityRTIndicator(20);
    const series = bars.map((bar) => {
      yangZhang.updateFrom(bar);
      return yangZhang.getValue();
    });
    expectSeries(series, expected.yangZhang20, "yangZhang20", LOG_TOLERANCE);
  });

  it.each([
    ["ATR(14)", () => new AtrRTIndicator(14), "atr14", 0],
    ["OBV", () => new ObvRTIndicator(), "obv", 0],
    ["MFI(14)", () => new MfiRTIndicator(14), "mfi14", 0],
    ["CMF(20)", () => new CmfRTIndicator(20), "cmf20", 0],
    ["Parkinson(20)", () => new ParkinsonVolatilityRTIndicator(20), "parkinson20", LOG_TOLERANCE],
    ["Garman-Klass(20)", () => new GarmanKlassVolatilityRTIndicator(20), "garmanKlass20", LOG_TOLERANCE],
    ["Rogers-Satchell(20)", () => new RogersSatchellVolatilityRTIndicator(20), "rogersSatchell20", LOG_TOLERANCE],
  ] as const)("%s equals Java's", (label, make, key, tolerance) => {
    const indicator = make();
    const series = bars.map((bar) => {
      indicator.updateFrom(bar);
      return indicator.getValue();
    });
    expectSeries(series, expected[key], label, tolerance);
  });

  it("SuperTrend(10, 3) and its two bands equal Java's", () => {
    const superTrend = new SuperTrendRTIndicator(10, 3.0);
    const main: number[] = [];
    const upper: number[] = [];
    const lower: number[] = [];
    for (const bar of bars) {
      superTrend.updateFrom(bar);
      main.push(superTrend.getValue());
      upper.push(superTrend.getUpperBand());
      lower.push(superTrend.getLowerBand());
    }
    expectSeries(main, expected.superTrend.main, "superTrend");
    expectSeries(upper, expected.superTrend.upper, "superTrend upper");
    expectSeries(lower, expected.superTrend.lower, "superTrend lower");
  });
});
