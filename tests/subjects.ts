import { expect } from "vitest";
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
import { AroonRTIndicator } from "$trend/AroonRTIndicator";
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
const flag = (value: boolean): number => (value ? 1 : 0);

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
  subject("alma20", "ALMA(20)", false, LOG_TOLERANCE, (p) => series(new AlmaRTIndicator(20), p, { ready })),
  subject("alma20Offset05", "ALMA(20) with an offset factor of 0.5", false, LOG_TOLERANCE, (p) =>
    series(new AlmaRTIndicator(20, 0.5, 6.0), p, { ready }),
  ),
  subject("alma20Sigma3", "ALMA(20) with a sigma factor of 3", false, LOG_TOLERANCE, (p) =>
    series(new AlmaRTIndicator(20, 0.85, 3.0), p, { ready }),
  ),
  subject("dema20", "DEMA(20)", false, 0, (p) => series(new DemaRTIndicator(20), p, { ready })),
  subject("envelopesDefault", "Envelopes() with the default periods and percentage", false, 0, (p) =>
    series(new EnvelopesRTIndicator(), p, { upper: (i) => i.getUpper(), lower: (i) => i.getLower(), ready }),
  ),
  subject("envelopes20Percentage5", "Envelopes(20, 5)", false, 0, (p) =>
    series(new EnvelopesRTIndicator(20, 5.0), p, { upper: (i) => i.getUpper(), lower: (i) => i.getLower(), ready }),
  ),
  subject("framaDefault", "FRAMA() with the default periods", false, LOG_TOLERANCE, (p) =>
    series(new FramaRTIndicator(), p, {
      fractalDimension: (i) => i.getFractalDimension(),
      alpha: (i) => i.getAlpha(),
      periods: (i) => i.periods,
      ready,
    }),
  ),
  subject("frama7", "FRAMA(7), an odd number of periods", false, LOG_TOLERANCE, (p) =>
    series(new FramaRTIndicator(7), p, {
      fractalDimension: (i) => i.getFractalDimension(),
      alpha: (i) => i.getAlpha(),
      periods: (i) => i.periods,
      ready,
    }),
  ),
  subject("leastSquaresMovingAverageDefault", "LSMA() with the default periods", false, 0, (p) =>
    series(new LeastSquaresMovingAverageRTIndicator(), p, { ready }),
  ),
  subject("leastSquaresMovingAverage10", "LSMA(10)", false, 0, (p) =>
    series(new LeastSquaresMovingAverageRTIndicator(10), p, { ready }),
  ),
  subject("mcGinleyDynamicDefault", "McGinley Dynamic() with the default periods", false, 0, (p) =>
    series(new McGinleyDynamicRTIndicator(), p, { ready }),
  ),
  subject("mcGinleyDynamic5", "McGinley Dynamic(5)", false, 0, (p) => series(new McGinleyDynamicRTIndicator(5), p, { ready })),
  subject("momentumDefault", "Momentum() with the default periods", false, 0, (p) => series(new MomentumRTIndicator(), p, { ready })),
  subject("momentum3", "Momentum(3)", false, 0, (p) => series(new MomentumRTIndicator(3), p, { ready })),
  subject("rocDefault", "ROC() with the default periods", false, 0, (p) => series(new RocRTIndicator(), p, { ready })),
  subject("roc3", "ROC(3)", false, 0, (p) => series(new RocRTIndicator(3), p, { ready })),
  subject("cmoDefault", "CMO() with the default periods", false, 0, (p) => series(new CmoRTIndicator(), p, { ready })),
  subject("cmo5", "CMO(5)", false, 0, (p) => series(new CmoRTIndicator(5), p, { ready })),
  subject("detrendedPriceOscillatorDefault", "DPO() with the default periods", false, 0, (p) =>
    series(new DetrendedPriceOscillatorRTIndicator(), p, { ready }),
  ),
  subject("detrendedPriceOscillator7", "DPO(7), an odd number of periods", false, 0, (p) =>
    series(new DetrendedPriceOscillatorRTIndicator(7), p, { ready }),
  ),
  subject("chandeForecastOscillatorDefault", "Chande forecast oscillator() with the default periods", false, 0, (p) =>
    series(new ChandeForecastOscillatorRTIndicator(), p, { lsmaValue: (i) => i.getLsmaValue(), ready }),
  ),
  subject("chandeForecastOscillator5", "Chande forecast oscillator(5)", false, 0, (p) =>
    series(new ChandeForecastOscillatorRTIndicator(5), p, { lsmaValue: (i) => i.getLsmaValue(), ready }),
  ),
  subject("connorsRsiDefault", "Connors RSI() with the default periods", false, 0, (p) => series(new ConnorsRsiRTIndicator(), p, { ready })),
  subject("connorsRsi5_3_20", "Connors RSI(5, 3, 20)", false, 0, (p) => series(new ConnorsRsiRTIndicator(5, 3, 20), p, { ready })),
  subject("connorsRsi2_4_8", "Connors RSI(2, 4, 8)", false, 0, (p) => series(new ConnorsRsiRTIndicator(2, 4, 8), p, { ready })),
  subject("coppockCurveDefault", "Coppock curve() with the default periods", false, 0, (p) => series(new CoppockCurveRTIndicator(), p, { ready })),
  subject("coppockCurve8_5_4", "Coppock curve(8, 5, 4)", false, 0, (p) => series(new CoppockCurveRTIndicator(8, 5, 4), p, { ready })),
  subject("fisherTransformDefault", "Fisher transform() with the default periods", false, LOG_TOLERANCE, (p) =>
    series(new FisherTransformRTIndicator(), p, { ready }),
  ),
  subject("fisherTransform5", "Fisher transform(5)", false, LOG_TOLERANCE, (p) => series(new FisherTransformRTIndicator(5), p, { ready })),
  subject("adaptiveFisherTransformDefault", "Adaptive Fisher transform() with the default periods", false, LOG_TOLERANCE, (p) =>
    series(new AdaptiveFisherTransformRTIndicator(), p, {
      efficiencyRatio: (i) => i.getEfficiencyRatio(),
      adaptivePeriod: (i) => i.getAdaptivePeriod(),
      ready,
    }),
  ),
  subject("adaptiveFisherTransform5_3_9", "Adaptive Fisher transform(5, 3, 9)", false, LOG_TOLERANCE, (p) =>
    series(new AdaptiveFisherTransformRTIndicator(5, 3, 9), p, {
      efficiencyRatio: (i) => i.getEfficiencyRatio(),
      adaptivePeriod: (i) => i.getAdaptivePeriod(),
      ready,
    }),
  ),
  subject("knowSureThingDefault", "Know sure thing() with the default periods and weights", false, 0, (p) =>
    series(new KnowSureThingRTIndicator(), p, { signal: (i) => i.getSignal(), ready }),
  ),
  subject("knowSureThing3Weighted", "Know sure thing of three rates of change, with weights of 1.5, 2.5 and 0.5", false, 0, (p) =>
    series(new KnowSureThingRTIndicator([3, 5, 7], [2, 3, 4], [1.5, 2.5, 0.5], 4), p, { signal: (i) => i.getSignal(), ready }),
  ),
  subject("trixDefault", "TRIX() with the default periods", false, 0, (p) => series(new TrixRTIndicator(), p, { ready })),
  subject("trix5", "TRIX(5)", false, 0, (p) => series(new TrixRTIndicator(5), p, { ready })),
  subject("trueStrengthIndexDefault", "True strength index() with the default periods", false, 0, (p) =>
    series(new TrueStrengthIndexRTIndicator(), p, { ready }),
  ),
  subject("trueStrengthIndex5_3", "True strength index(5, 3)", false, 0, (p) => series(new TrueStrengthIndexRTIndicator(5, 3), p, { ready })),

  subject("efficiencyRatioDefault", "Efficiency ratio()", false, 0, (p) =>
    series(new EfficiencyRatioRTIndicator(), p, { direction: (i) => i.getDirection(), volatility: (i) => i.getVolatility(), ready }),
  ),
  subject("efficiencyRatio3", "Efficiency ratio(3)", false, 0, (p) =>
    series(new EfficiencyRatioRTIndicator(3), p, { direction: (i) => i.getDirection(), volatility: (i) => i.getVolatility(), ready }),
  ),
  subject("efficiencyRatio1", "Efficiency ratio(1)", false, 0, (p) =>
    series(new EfficiencyRatioRTIndicator(1), p, { direction: (i) => i.getDirection(), volatility: (i) => i.getVolatility(), ready }),
  ),
  subject("relativeVolatilityIndexDefault", "Relative volatility index()", false, 0, (p) =>
    series(new RelativeVolatilityIndexRTIndicator(), p, { ready }),
  ),
  subject("relativeVolatilityIndex5_3", "Relative volatility index(5, 3)", false, 0, (p) =>
    series(new RelativeVolatilityIndexRTIndicator(5, 3), p, { ready }),
  ),
  subject("relativeVolatilityIndex2_1", "Relative volatility index(2, 1)", false, 0, (p) =>
    series(new RelativeVolatilityIndexRTIndicator(2, 1), p, { ready }),
  ),

  // The indicators that read whole bars, fed a price through update(): the bar has every field equal to the price
  // (the Mass index takes the price as the range itself)
  subject("aroon5AsPrice", "Aroon(5) fed a price", false, 0, (p) =>
    series(new AroonRTIndicator(5), p, { up: (i) => i.getAroonUp(), down: (i) => i.getAroonDown(), ready }),
  ),
  subject("chandeKrollStop5AsPrice", "Chande Kroll stop(4, 1.5, 3, 2) fed a price", false, 0, (p) =>
    series(new ChandeKrollStopRTIndicator(4, 1.5, 3, 2), p, { stopShort: (i) => i.getStopShort(), ready }),
  ),
  subject("chandelierExit5AsPrice", "Chandelier exit(5, 2) fed a price", false, 0, (p) =>
    series(new ChandelierExitRTIndicator(5, 2.0), p, { shortExit: (i) => i.getShortExit(), ready }),
  ),
  subject("donchianChannel5AsPrice", "Donchian channel(5) fed a price", false, 0, (p) =>
    series(new DonchianChannelRTIndicator(5), p, { upper: (i) => i.getUpper(), lower: (i) => i.getLower(), ready }),
  ),
  subject("parabolicSarDefaultAsPrice", "Parabolic SAR() fed a price", false, 0, (p) =>
    series(new ParabolicSarRTIndicator(), p, { upTrend: (i) => flag(i.isUpTrend()), ready }),
  ),
  subject("vortex5AsPrice", "Vortex(5) fed a price", false, 0, (p) =>
    series(new VortexRTIndicator(5), p, { viPlus: (i) => i.getVIPlus(), viMinus: (i) => i.getVIMinus(), ready }),
  ),
  subject("choppinessIndex5AsPrice", "Choppiness index(5) fed a price", false, LOG_TOLERANCE, (p) =>
    series(new ChoppinessIndexRTIndicator(5), p, { ready }),
  ),
  subject("keltnerChannel5_3_2AsPrice", "Keltner channel(5, 3, 2) fed a price", false, 0, (p) =>
    series(new KeltnerChannelRTIndicator(5, 3, 2.0), p, { upper: (i) => i.getUpper(), lower: (i) => i.getLower(), ready }),
  ),
  subject("massIndex5_3AsPrice", "Mass index(5, 3) fed a price as the range", false, 0, (p) =>
    series(new MassIndexRTIndicator(5, 3), p, { ready }),
  ),
  subject("natr5AsPrice", "NATR(5) fed a price", false, 0, (p) => series(new NatrRTIndicator(5), p, { ready })),
];

/** Runs a subject on the prices and compares each of its outputs with Java's. */
export function expectSubject(subject: Subject, prices: readonly number[], expected: SeriesSet, label: string): void {
  const actual = subject.run(prices);
  expect(Object.keys(actual).sort(), `${label}: outputs`).toEqual(Object.keys(expected).sort());
  for (const output of Object.keys(expected)) {
    expectSeries(actual[output], expected[output], `${label} ${output}`, subject.tolerance);
  }
}
