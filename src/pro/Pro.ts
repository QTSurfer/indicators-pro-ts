import { DisplayHint, type AbstractRTIndicator, type InstrumentGroupRTIndicator, type RTIndicator } from "@qtsurfer/indicators";
import { javaDouble } from "$core/JavaNumber";
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
import { ProOutput } from "./ProOutput";

/**
 * Fluent factories for the pro indicators, hung off an existing group, with the ids, overloads and
 * outputs of the Java engine's `Pro`:
 *
 * ```ts
 * Pro.on(group).adx().vwap().yangZhang(20).ichimoku();
 * ```
 *
 * The bar readers here read whole bars (high, low, volume): they belong on a kline group. On a
 * ticker those values are the exchange's 24-hour statistics and the output stops meaning what its
 * name says. The statistics (`kurtosis`, `autocorrelation`, `hurstExponent`, `linearRegressionSlope`,
 * `rollingPercentile`, `simpleLinearRegression`, `skewness`, `valueAtRisk` and `zScore`), the risk
 * ones (`calmarRatio`, `maxDrawdown`, `omegaRatio`, `sharpeRatio`, `sortinoRatio`, `tailRatio`,
 * `ulcerIndex`, `ewmaVolatility` and `realizedVolatility`), and the averages and oscillators that
 * follow them (`alma`, `dema`, `envelopes`, `frama`, `leastSquaresMovingAverage`, `mcGinleyDynamic`,
 * `momentum`, `roc`, `cmo`, `detrendedPriceOscillator`, `chandeForecastOscillator`, `connorsRsi`,
 * `coppockCurve`, `fisherTransform`, `adaptiveFisherTransform`, `knowSureThing`, `trix` and
 * `trueStrengthIndex`) read the group's price, as the base indicators do: they work on a ticker feed
 * too.
 */
export class Pro {
  /**
   * Suffixes of the outputs of an indicator that has several, registered beside it as `name +
   * suffix`, as the base Bollinger bands do (`Upper`, `Lower`). The indicator itself is its main
   * output (the ADX, the Tenkan-sen).
   */
  static readonly SUFFIX_UPPER = "Upper";
  static readonly SUFFIX_LOWER = "Lower";
  static readonly SUFFIX_PLUS_DI = "PlusDI";
  static readonly SUFFIX_MINUS_DI = "MinusDI";
  static readonly SUFFIX_KIJUN = "Kijun";
  static readonly SUFFIX_SENKOU_A = "SenkouA";
  static readonly SUFFIX_SENKOU_B = "SenkouB";
  static readonly SUFFIX_CHIKOU = "Chikou";
  static readonly SUFFIX_INTERCEPT = "Intercept";
  static readonly SUFFIX_MEDIAN = "Median";
  static readonly SUFFIX_MIN = "Min";
  static readonly SUFFIX_MAX = "Max";
  static readonly SUFFIX_R_SQUARED = "RSquared";
  static readonly SUFFIX_STANDARD_ERROR = "StandardError";
  static readonly SUFFIX_CURRENT = "Current";
  static readonly SUFFIX_SIGNAL = "Signal";

  private constructor(private readonly target: InstrumentGroupRTIndicator) {}

  static on(group: InstrumentGroupRTIndicator): Pro {
    return new Pro(group);
  }

  /** The wrapped group, to resume base-builder chaining. */
  group(): InstrumentGroupRTIndicator {
    return this.target;
  }

  // --- Trend ---

  /** Average Directional Index over 14 periods by default, registered as `adx` + periods. */
  adx(): this;
  adx(periods: number): this;
  adx(name: string, periods: number): this;
  adx(nameOrPeriods?: string | number, periods?: number): this {
    if (typeof nameOrPeriods !== "string") {
      const p = nameOrPeriods ?? 14;
      return this.adx(`adx${p}`, p);
    }
    const adx = new AdxRTIndicator(periods!);
    adx.withMeta("periods", periods).withDisplayHint(DisplayHint.PERCENT);
    return this.withOutputs(
      nameOrPeriods,
      adx,
      output(Pro.SUFFIX_PLUS_DI, () => adx.getPlusDI(), adx, DisplayHint.PERCENT),
      output(Pro.SUFFIX_MINUS_DI, () => adx.getMinusDI(), adx, DisplayHint.PERCENT),
    );
  }

  /** SuperTrend with the standard (10, 3.0) parameters, registered as `st10_3`. */
  superTrend(): this;
  superTrend(name: string): this;
  superTrend(atrPeriod: number, multiplier: number): this;
  superTrend(name: string, atrPeriod: number, multiplier: number): this;
  superTrend(...args: [] | [string] | [number, number] | [string, number, number]): this {
    if (args.length === 0) {
      return this.superTrend(10, 3.0);
    }
    if (args.length === 1) {
      return this.superTrend(args[0], 10, 3.0);
    }
    if (typeof args[0] === "number") {
      const [atrPeriod, multiplier] = args as [number, number];
      // A whole multiplier has no decimal part in the id, as in the Java engine
      return this.superTrend(`st${atrPeriod}_${multiplier}`, atrPeriod, multiplier);
    }
    const [name, atrPeriod, multiplier] = args as [string, number, number];
    const superTrend = new SuperTrendRTIndicator(atrPeriod, multiplier);
    superTrend.withMeta("atrPeriod", atrPeriod).withMeta("multiplier", multiplier);
    return this.withOutputs(
      name,
      superTrend,
      output(Pro.SUFFIX_UPPER, () => superTrend.getUpperBand(), superTrend, DisplayHint.ABSOLUTE),
      output(Pro.SUFFIX_LOWER, () => superTrend.getLowerBand(), superTrend, DisplayHint.ABSOLUTE),
    );
  }

  /** Ichimoku with the standard (9, 26, 52) parameters, registered as `ichi9_26_52`. */
  ichimoku(): this;
  ichimoku(name: string): this;
  ichimoku(tenkanPeriod: number, kijunPeriod: number, senkouPeriod: number): this;
  ichimoku(name: string, tenkanPeriod: number, kijunPeriod: number, senkouPeriod: number): this;
  ichimoku(...args: [] | [string] | [number, number, number] | [string, number, number, number]): this {
    if (args.length === 0) {
      return this.ichimoku(9, 26, 52);
    }
    if (args.length === 1) {
      return this.ichimoku(args[0], 9, 26, 52);
    }
    if (typeof args[0] === "number") {
      const [tenkan, kijun, senkou] = args as [number, number, number];
      return this.ichimoku(`ichi${tenkan}_${kijun}_${senkou}`, tenkan, kijun, senkou);
    }
    const [name, tenkan, kijun, senkou] = args as [string, number, number, number];
    const ichimoku = new IchimokuRTIndicator(tenkan, kijun, senkou);
    ichimoku.withMeta("tenkanPeriod", tenkan).withMeta("kijunPeriod", kijun).withMeta("senkouPeriod", senkou);
    // The indicator itself is the Tenkan-sen; the other four lines are named beside it
    return this.withOutputs(
      name,
      ichimoku,
      output(Pro.SUFFIX_KIJUN, () => ichimoku.getKijunSen(), ichimoku, DisplayHint.ABSOLUTE),
      output(Pro.SUFFIX_SENKOU_A, () => ichimoku.getSenkouSpanA(), ichimoku, DisplayHint.ABSOLUTE),
      output(Pro.SUFFIX_SENKOU_B, () => ichimoku.getSenkouSpanB(), ichimoku, DisplayHint.ABSOLUTE),
      output(Pro.SUFFIX_CHIKOU, () => ichimoku.getChikouSpan(), ichimoku, DisplayHint.ABSOLUTE),
    );
  }

  // --- Volume ---

  /** On-Balance Volume, registered as `obv` or under the given name. It is volume-denominated. */
  obv(name = "obv"): this {
    this.target.add(name, new ObvRTIndicator().withDisplayHint(DisplayHint.VOLUME));
    return this;
  }

  /** Volume-Weighted Average Price, registered as `vwap` or under the given name. */
  vwap(name = "vwap"): this {
    this.target.add(name, new VwapRTIndicator());
    return this;
  }

  /** Money Flow Index over 14 periods by default, registered as `mfi` + periods. Its output is 0 to 100. */
  mfi(): this;
  mfi(periods: number): this;
  mfi(name: string, periods: number): this;
  mfi(nameOrPeriods?: string | number, periods?: number): this {
    if (typeof nameOrPeriods !== "string") {
      const p = nameOrPeriods ?? 14;
      return this.mfi(`mfi${p}`, p);
    }
    const mfi = new MfiRTIndicator(periods!);
    mfi.withMeta("periods", periods).withDisplayHint(DisplayHint.PERCENT);
    this.target.add(nameOrPeriods, mfi);
    return this;
  }

  /** Chaikin Money Flow over 20 periods by default, registered as `cmf` + periods. Its output is -1 to 1. */
  cmf(): this;
  cmf(periods: number): this;
  cmf(name: string, periods: number): this;
  cmf(nameOrPeriods?: string | number, periods?: number): this {
    if (typeof nameOrPeriods !== "string") {
      const p = nameOrPeriods ?? 20;
      return this.cmf(`cmf${p}`, p);
    }
    this.target.add(nameOrPeriods, new CmfRTIndicator(periods!).withMeta("periods", periods));
    return this;
  }

  // --- Statistics ---

  /** Excess kurtosis of the group's price over `periods`, registered as `kurt` + periods. */
  kurtosis(periods: number): this;
  kurtosis(name: string, periods: number): this;
  kurtosis(nameOrPeriods: string | number, periods?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.kurtosis(`kurt${nameOrPeriods}`, nameOrPeriods);
    }
    this.target.add(nameOrPeriods, new KurtosisRTIndicator(periods!).withMeta("periods", periods));
    return this;
  }

  /** Lag-1 autocorrelation of the log returns of the group's price over `periods` (at least 4), registered as `acf` + periods. */
  autocorrelation(periods: number): this;
  autocorrelation(name: string, periods: number): this;
  autocorrelation(nameOrPeriods: string | number, periods?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.autocorrelation(`acf${nameOrPeriods}`, nameOrPeriods);
    }
    this.target.add(nameOrPeriods, new AutocorrelationRTIndicator(periods!).withMeta("periods", periods));
    return this;
  }

  /** Hurst exponent (rescaled range) of the log returns of the group's price over `periods` (at least 4), registered as `hurst` + periods. */
  hurstExponent(periods: number): this;
  hurstExponent(name: string, periods: number): this;
  hurstExponent(nameOrPeriods: string | number, periods?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.hurstExponent(`hurst${nameOrPeriods}`, nameOrPeriods);
    }
    this.target.add(nameOrPeriods, new HurstExponentRTIndicator(periods!).withMeta("periods", periods));
    return this;
  }

  /**
   * Slope of the least-squares line through the group's price over `periods`, registered as `lrs` +
   * periods; the intercept of the line is its other output.
   */
  linearRegressionSlope(periods: number): this;
  linearRegressionSlope(name: string, periods: number): this;
  linearRegressionSlope(nameOrPeriods: string | number, periods?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.linearRegressionSlope(`lrs${nameOrPeriods}`, nameOrPeriods);
    }
    const slope = new LinearRegressionSlopeRTIndicator(periods!);
    slope.withMeta("periods", periods);
    // The indicator itself is the slope; the intercept is a price level, so it goes on the price axis
    return this.withOutputs(
      nameOrPeriods,
      slope,
      output(Pro.SUFFIX_INTERCEPT, () => slope.getIntercept(), slope, DisplayHint.ABSOLUTE),
    );
  }

  /**
   * Rolling percentile of the group's price over `periods`, registered as `pctl` + periods + `_` +
   * percentile (`pctl20_0.95`, `pctl20_1`). The median, the minimum and the maximum of the window are
   * its other outputs. `percentile` is in [0, 1]: 0.5 is the median, 0.95 the 95th percentile.
   */
  rollingPercentile(periods: number, percentile: number): this;
  rollingPercentile(name: string, periods: number, percentile: number): this;
  rollingPercentile(...args: [number, number] | [string, number, number]): this {
    if (typeof args[0] === "number") {
      const [periods, percentile] = args as [number, number];
      return this.rollingPercentile(`pctl${periods}_${percentile}`, periods, percentile);
    }
    const [name, periods, percentile] = args as [string, number, number];
    const rolling = new RollingPercentileRTIndicator(periods, percentile);
    rolling.withMeta("periods", periods).withMeta("percentile", percentile);
    // The indicator itself is the percentile; the window's median, minimum and maximum are named beside
    // it, all price levels
    return this.withOutputs(
      name,
      rolling,
      output(Pro.SUFFIX_MEDIAN, () => rolling.getMedian(), rolling, DisplayHint.ABSOLUTE),
      output(Pro.SUFFIX_MIN, () => rolling.getMin(), rolling, DisplayHint.ABSOLUTE),
      output(Pro.SUFFIX_MAX, () => rolling.getMax(), rolling, DisplayHint.ABSOLUTE),
    );
  }

  /**
   * Least-squares regression of the group's price over `periods`, registered as `slr` + periods; the
   * indicator is the slope, and the intercept, R squared and standard error of the fit are its other
   * outputs.
   */
  simpleLinearRegression(periods: number): this;
  simpleLinearRegression(name: string, periods: number): this;
  simpleLinearRegression(nameOrPeriods: string | number, periods?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.simpleLinearRegression(`slr${nameOrPeriods}`, nameOrPeriods);
    }
    const regression = new SimpleLinearRegressionRTIndicator(periods!);
    regression.withMeta("periods", periods);
    // The R squared is a [0, 1] ratio and the standard error is no price level either: neither takes a
    // hint, which is ABSOLUTE, the default, expressed by absence
    return this.withOutputs(
      nameOrPeriods,
      regression,
      output(Pro.SUFFIX_INTERCEPT, () => regression.getIntercept(), regression, DisplayHint.ABSOLUTE),
      output(Pro.SUFFIX_R_SQUARED, () => regression.getRSquared(), regression, DisplayHint.ABSOLUTE),
      output(Pro.SUFFIX_STANDARD_ERROR, () => regression.getStandardError(), regression, DisplayHint.ABSOLUTE),
    );
  }

  /** Sample skewness of the group's price over `periods` (at least 3), registered as `skew` + periods. */
  skewness(periods: number): this;
  skewness(name: string, periods: number): this;
  skewness(nameOrPeriods: string | number, periods?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.skewness(`skew${nameOrPeriods}`, nameOrPeriods);
    }
    this.target.add(nameOrPeriods, new SkewnessRTIndicator(periods!).withMeta("periods", periods));
    return this;
  }

  /**
   * Gaussian Value at Risk of the log returns of the group's price over `periods` at 95% confidence,
   * registered as `valRisk` + periods (`var` would read as variance). A positive value is a potential
   * loss. `confidence` is in (0, 1), e.g. 0.99; `annualizationFactor` scales the mean return by the
   * factor and the standard deviation by its square root, e.g. 252 for daily bars.
   *
   * The two forms of 95% differ a little, as in the Java engine: without `confidence` the class keeps
   * its default z (1.6448536), with `0.95` the z comes from the inverse normal approximation
   * (1.6452114).
   */
  valueAtRisk(periods: number): this;
  valueAtRisk(name: string, periods: number): this;
  valueAtRisk(name: string, periods: number, confidence: number): this;
  valueAtRisk(name: string, periods: number, confidence: number, annualizationFactor: number): this;
  valueAtRisk(nameOrPeriods: string | number, periods?: number, confidence?: number, annualizationFactor = 1.0): this {
    if (typeof nameOrPeriods === "number") {
      return this.valueAtRisk(`valRisk${nameOrPeriods}`, nameOrPeriods);
    }
    const valueAtRisk = new ValueAtRiskRTIndicator(periods!);
    if (confidence === undefined) {
      // The class defaults (95% confidence, no annualization), left as they are
      valueAtRisk.withMeta("periods", periods).withMeta("confidence", 0.95);
    } else {
      valueAtRisk
        .withConfidenceLevel(confidence)
        .withAnnualizationFactor(annualizationFactor)
        .withMeta("periods", periods)
        .withMeta("confidence", confidence);
    }
    this.target.add(nameOrPeriods, valueAtRisk);
    return this;
  }

  /** Z-score of the group's price over `periods`, registered as `zscore` + periods. */
  zScore(periods: number): this;
  zScore(name: string, periods: number): this;
  zScore(nameOrPeriods: string | number, periods?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.zScore(`zscore${nameOrPeriods}`, nameOrPeriods);
    }
    this.target.add(nameOrPeriods, new ZScoreRTIndicator(periods!).withMeta("periods", periods));
    return this;
  }

  // --- Risk and performance: they read the group's price, and work on its log returns ---

  /**
   * Calmar ratio of the group's price over `periods` (at least 2), registered as `calmar` + periods:
   * the annualized return over the maximum drawdown of the window. `annualizationFactor` multiplies
   * the mean return, 252 by default.
   */
  calmarRatio(periods: number): this;
  calmarRatio(name: string, periods: number, annualizationFactor?: number): this;
  calmarRatio(nameOrPeriods: string | number, periods?: number, annualizationFactor?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.calmarRatio(`calmar${nameOrPeriods}`, nameOrPeriods);
    }
    const calmar = new CalmarRatioRTIndicator(periods!);
    if (annualizationFactor !== undefined) {
      calmar.withAnnualizationFactor(annualizationFactor);
    }
    this.target.add(nameOrPeriods, calmar.withMeta("periods", periods));
    return this;
  }

  /**
   * Maximum drawdown of the group's price, as a fraction from 0 to 1, registered as `maxDd`; the
   * drawdown now, from the peak, is its other output.
   */
  maxDrawdown(name = "maxDd"): this {
    const drawdown = new MaxDrawdownRTIndicator();
    return this.withOutputs(
      name,
      drawdown,
      output(Pro.SUFFIX_CURRENT, () => drawdown.getCurrentDrawdown(), drawdown, DisplayHint.ABSOLUTE),
    );
  }

  /**
   * Omega ratio of the group's price over `periods` (at least 2), registered as `omega` + periods:
   * the gains over the losses of the returns, against a `threshold` return that is 0 by default.
   */
  omegaRatio(periods: number): this;
  omegaRatio(name: string, periods: number, threshold?: number): this;
  omegaRatio(nameOrPeriods: string | number, periods?: number, threshold = 0): this {
    if (typeof nameOrPeriods === "number") {
      return this.omegaRatio(`omega${nameOrPeriods}`, nameOrPeriods);
    }
    const omega = new OmegaRatioRTIndicator(periods!).withThreshold(threshold);
    this.target.add(nameOrPeriods, omega.withMeta("periods", periods).withMeta("threshold", threshold));
    return this;
  }

  /**
   * Sharpe ratio of the group's price over `periods`, registered as `sharpe` + periods. `riskFreeRate`
   * is per period and 0 by default; `annualizationFactor` is 1 by default (`Math.sqrt(252)` for
   * daily bars).
   */
  sharpeRatio(periods: number): this;
  sharpeRatio(name: string, periods: number, riskFreeRate?: number, annualizationFactor?: number): this;
  sharpeRatio(nameOrPeriods: string | number, periods?: number, riskFreeRate = 0, annualizationFactor = 1.0): this {
    if (typeof nameOrPeriods === "number") {
      return this.sharpeRatio(`sharpe${nameOrPeriods}`, nameOrPeriods);
    }
    const sharpe = new SharpeRatioRTIndicator(periods!)
      .withRiskFreeRate(riskFreeRate)
      .withAnnualizationFactor(annualizationFactor);
    this.target.add(nameOrPeriods, sharpe.withMeta("periods", periods).withMeta("riskFreeRate", riskFreeRate));
    return this;
  }

  /**
   * Sortino ratio of the group's price over `periods`, registered as `sortino` + periods. `mar` is the
   * minimum acceptable return, 0 by default; `annualizationFactor` is 1 by default.
   */
  sortinoRatio(periods: number): this;
  sortinoRatio(name: string, periods: number, mar?: number, annualizationFactor?: number): this;
  sortinoRatio(nameOrPeriods: string | number, periods?: number, mar = 0, annualizationFactor = 1.0): this {
    if (typeof nameOrPeriods === "number") {
      return this.sortinoRatio(`sortino${nameOrPeriods}`, nameOrPeriods);
    }
    const sortino = new SortinoRatioRTIndicator(periods!).withMAR(mar).withAnnualizationFactor(annualizationFactor);
    this.target.add(nameOrPeriods, sortino.withMeta("periods", periods).withMeta("mar", mar));
    return this;
  }

  /**
   * Tail ratio of the group's price over `periods` (at least 2), registered as `tail` + periods: the
   * `upper` percentile of the returns over the absolute `lower` one, 0.95 and 0.05 by default, both
   * in (0, 1).
   */
  tailRatio(periods: number): this;
  tailRatio(name: string, periods: number): this;
  tailRatio(name: string, periods: number, upper: number, lower: number): this;
  tailRatio(nameOrPeriods: string | number, periods?: number, upper = 0.95, lower = 0.05): this {
    if (typeof nameOrPeriods === "number") {
      return this.tailRatio(`tail${nameOrPeriods}`, nameOrPeriods);
    }
    const tail = new TailRatioRTIndicator(periods!).withPercentiles(upper, lower);
    this.target.add(nameOrPeriods, tail.withMeta("periods", periods).withMeta("upper", upper).withMeta("lower", lower));
    return this;
  }

  /** Ulcer index of the group's price over `periods`, registered as `ulcer` + periods; a drawdown in percent. */
  ulcerIndex(periods: number): this;
  ulcerIndex(name: string, periods: number): this;
  ulcerIndex(nameOrPeriods: string | number, periods?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.ulcerIndex(`ulcer${nameOrPeriods}`, nameOrPeriods);
    }
    const ulcer = new UlcerIndexRTIndicator(periods!);
    this.target.add(nameOrPeriods, ulcer.withMeta("periods", periods).withDisplayHint(DisplayHint.PERCENT));
    return this;
  }

  /**
   * Exponentially weighted volatility of the log returns of the group's price, registered as `ewma` +
   * lambda (`ewma0.94`). `lambda` is in (0, 1) and 0.94 by default; `annualizationFactor` is 1 by default.
   */
  ewmaVolatility(): this;
  ewmaVolatility(lambda: number): this;
  ewmaVolatility(name: string): this;
  ewmaVolatility(name: string, lambda: number, annualizationFactor?: number): this;
  ewmaVolatility(nameOrLambda?: string | number, lambda = 0.94, annualizationFactor = 1.0): this {
    if (nameOrLambda === undefined) {
      return this.ewmaVolatility(0.94);
    }
    if (typeof nameOrLambda === "number") {
      return this.ewmaVolatility(`ewma${nameOrLambda}`, nameOrLambda);
    }
    const ewma = new EwmaVolatilityRTIndicator(lambda).withAnnualizationFactor(annualizationFactor);
    this.target.add(nameOrLambda, ewma.withMeta("lambda", lambda));
    return this;
  }

  /**
   * Realized volatility of the log returns of the group's price over `periods`, registered as `rvol` +
   * periods. `annualizationFactor` is 1 by default.
   */
  realizedVolatility(periods: number): this;
  realizedVolatility(name: string, periods: number, annualizationFactor?: number): this;
  realizedVolatility(nameOrPeriods: string | number, periods?: number, annualizationFactor = 1.0): this {
    if (typeof nameOrPeriods === "number") {
      return this.realizedVolatility(`rvol${nameOrPeriods}`, nameOrPeriods);
    }
    const realized = new RealizedVolatilityRTIndicator(periods!).withAnnualizationFactor(annualizationFactor);
    this.target.add(nameOrPeriods, realized.withMeta("periods", periods));
    return this;
  }

  /**
   * Yang-Zhang volatility over `periods`, registered as `yz` + periods.
   * `annualizationFactor` multiplies the volatility, e.g. `Math.sqrt(252)` for daily bars.
   */
  yangZhang(periods: number): this;
  yangZhang(name: string, periods: number, annualizationFactor?: number): this;
  yangZhang(nameOrPeriods: string | number, periods?: number, annualizationFactor = 1.0): this {
    if (typeof nameOrPeriods === "number") {
      return this.yangZhang(`yz${nameOrPeriods}`, nameOrPeriods);
    }
    const yangZhang = new YangZhangVolatilityRTIndicator(periods!).withAnnualizationFactor(annualizationFactor);
    this.target.add(nameOrPeriods, yangZhang.withMeta("periods", periods));
    return this;
  }

  /** Parkinson volatility over `periods`, registered as `park` + periods. Reads whole bars. */
  parkinson(periods: number): this;
  parkinson(name: string, periods: number, annualizationFactor?: number): this;
  parkinson(nameOrPeriods: string | number, periods?: number, annualizationFactor = 1.0): this {
    if (typeof nameOrPeriods === "number") {
      return this.parkinson(`park${nameOrPeriods}`, nameOrPeriods);
    }
    const parkinson = new ParkinsonVolatilityRTIndicator(periods!).withAnnualizationFactor(annualizationFactor);
    this.target.add(nameOrPeriods, parkinson.withMeta("periods", periods));
    return this;
  }

  /** Garman-Klass volatility over `periods`, registered as `gk` + periods. Reads whole bars. */
  garmanKlass(periods: number): this;
  garmanKlass(name: string, periods: number, annualizationFactor?: number): this;
  garmanKlass(nameOrPeriods: string | number, periods?: number, annualizationFactor = 1.0): this {
    if (typeof nameOrPeriods === "number") {
      return this.garmanKlass(`gk${nameOrPeriods}`, nameOrPeriods);
    }
    const garmanKlass = new GarmanKlassVolatilityRTIndicator(periods!).withAnnualizationFactor(annualizationFactor);
    this.target.add(nameOrPeriods, garmanKlass.withMeta("periods", periods));
    return this;
  }

  /** Rogers-Satchell volatility over `periods`, registered as `rs` + periods. Reads whole bars. */
  rogersSatchell(periods: number): this;
  rogersSatchell(name: string, periods: number, annualizationFactor?: number): this;
  rogersSatchell(nameOrPeriods: string | number, periods?: number, annualizationFactor = 1.0): this {
    if (typeof nameOrPeriods === "number") {
      return this.rogersSatchell(`rs${nameOrPeriods}`, nameOrPeriods);
    }
    const rogersSatchell = new RogersSatchellVolatilityRTIndicator(periods!).withAnnualizationFactor(annualizationFactor);
    this.target.add(nameOrPeriods, rogersSatchell.withMeta("periods", periods));
    return this;
  }

  // --- Averages and oscillators: they read the group's price ---

  /**
   * Arnaud Legoux moving average of the group's price over `periods`, registered as `alma` + periods, with
   * the offset factor 0.85 and the sigma factor 6 of the class: a Gaussian weighting whose peak sits near the
   * newest price of the window.
   *
   * `offsetFactor` is in [0, 1]: where the peak of the Gaussian sits in the window, 0 at the oldest price and
   * 1 at the newest. `sigmaFactor` is finite and positive: the window over it is the width of the Gaussian,
   * so the larger it is, the fewer prices weigh in.
   */
  alma(periods: number): this;
  alma(name: string, periods: number): this;
  alma(name: string, periods: number, offsetFactor: number, sigmaFactor: number): this;
  alma(...args: [number] | [string, number] | [string, number, number, number]): this {
    if (args.length === 1) {
      return this.alma(`alma${args[0]}`, args[0]);
    }
    if (args.length === 2) {
      const [name, periods] = args;
      // The class defaults (offset factor 0.85, sigma factor 6), left as they are
      this.target.add(
        name,
        new AlmaRTIndicator(periods).withMeta("periods", periods).withMeta("offsetFactor", 0.85).withMeta("sigmaFactor", 6.0),
      );
      return this;
    }
    const [name, periods, offsetFactor, sigmaFactor] = args;
    this.target.add(
      name,
      new AlmaRTIndicator(periods, offsetFactor, sigmaFactor)
        .withMeta("periods", periods)
        .withMeta("offsetFactor", offsetFactor)
        .withMeta("sigmaFactor", sigmaFactor),
    );
    return this;
  }

  /** Double exponential moving average of the group's price over `periods`, registered as `dema` + periods. */
  dema(periods: number): this;
  dema(name: string, periods: number): this;
  dema(nameOrPeriods: string | number, periods?: number): this {
    if (typeof nameOrPeriods === "number") {
      return this.dema(`dema${nameOrPeriods}`, nameOrPeriods);
    }
    this.target.add(nameOrPeriods, new DemaRTIndicator(periods!).withMeta("periods", periods));
    return this;
  }

  /**
   * Envelopes of the group's price: an EMA of 20 periods with a band of 2.5% above and below it, registered
   * as `env20_2.5`. The indicator itself is the middle line; the upper and the lower bands are its other
   * outputs. The id is `env` + periods + `_` + percentage, and a whole percentage drops its decimal part, as
   * the SuperTrend multiplier does (`env20_2.5`, `env20_5`). `percentage` is finite and at least 0: how far
   * each band sits from the EMA, in percent of it (0 puts both bands on the middle line).
   */
  envelopes(): this;
  envelopes(periods: number, percentage: number): this;
  envelopes(name: string): this;
  envelopes(name: string, periods: number, percentage: number): this;
  envelopes(...args: [] | [string] | [number, number] | [string, number, number]): this {
    return this.shaped(
      args,
      [20, 2.5],
      (periods, percentage) => `env${periods}_${numberName(percentage)}`,
      (name, periods, percentage) => {
        const envelopes = new EnvelopesRTIndicator(periods, percentage);
        envelopes.withMeta("periods", periods).withMeta("percentage", percentage);
        // The indicator itself is the middle line; the bands are price levels
        this.withOutputs(
          name,
          envelopes,
          output(Pro.SUFFIX_UPPER, () => envelopes.getUpper(), envelopes, DisplayHint.ABSOLUTE),
          output(Pro.SUFFIX_LOWER, () => envelopes.getLower(), envelopes, DisplayHint.ABSOLUTE),
        );
      },
    );
  }

  /**
   * Fractal adaptive moving average of the group's price over 20 periods, registered as `frama20`. The
   * fractal dimension and the smoothing factor it works from are diagnostics of the class, not outputs.
   * `periods` is at least 3. The class rounds an odd value up to the next even one, but the id and the
   * metadata record the value asked for (`frama(21)` is `frama21`).
   */
  frama(): this;
  frama(periods: number): this;
  frama(name: string): this;
  frama(name: string, periods: number): this;
  frama(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "frama", 20, (periods) => new FramaRTIndicator(periods));
  }

  /**
   * Least squares moving average of the group's price over 25 periods, registered as `lsma25`: the value the
   * regression line of the window takes at the newest price. `periods` is at least 2.
   */
  leastSquaresMovingAverage(): this;
  leastSquaresMovingAverage(periods: number): this;
  leastSquaresMovingAverage(name: string): this;
  leastSquaresMovingAverage(name: string, periods: number): this;
  leastSquaresMovingAverage(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "lsma", 25, (periods) => new LeastSquaresMovingAverageRTIndicator(periods));
  }

  /** McGinley Dynamic of the group's price over 14 periods, registered as `mcg14`. */
  mcGinleyDynamic(): this;
  mcGinleyDynamic(periods: number): this;
  mcGinleyDynamic(name: string): this;
  mcGinleyDynamic(name: string, periods: number): this;
  mcGinleyDynamic(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "mcg", 14, (periods) => new McGinleyDynamicRTIndicator(periods));
  }

  /** Momentum of the group's price over 10 periods, registered as `mom10`: the price minus the price 10 periods ago. */
  momentum(): this;
  momentum(periods: number): this;
  momentum(name: string): this;
  momentum(name: string, periods: number): this;
  momentum(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "mom", 10, (periods) => new MomentumRTIndicator(periods));
  }

  /** Rate of change of the group's price over 12 periods, in percent, registered as `roc12`. */
  roc(): this;
  roc(periods: number): this;
  roc(name: string): this;
  roc(name: string, periods: number): this;
  roc(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "roc", 12, (periods) => new RocRTIndicator(periods));
  }

  /** Chande momentum oscillator of the group's price over 14 periods, in [-100, 100], registered as `cmo14`. */
  cmo(): this;
  cmo(periods: number): this;
  cmo(name: string): this;
  cmo(name: string, periods: number): this;
  cmo(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "cmo", 14, (periods) => new CmoRTIndicator(periods));
  }

  /** Detrended price oscillator of the group's price over 20 periods, registered as `dpo20`. `periods` is at least 3. */
  detrendedPriceOscillator(): this;
  detrendedPriceOscillator(periods: number): this;
  detrendedPriceOscillator(name: string): this;
  detrendedPriceOscillator(name: string, periods: number): this;
  detrendedPriceOscillator(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "dpo", 20, (periods) => new DetrendedPriceOscillatorRTIndicator(periods));
  }

  /**
   * Chande forecast oscillator of the group's price over 14 periods, registered as `cfo14`: the distance of
   * the price from its regression line, in percent of the price. The regression value it works from is a
   * diagnostic of the class, not an output. `periods` is at least 2.
   */
  chandeForecastOscillator(): this;
  chandeForecastOscillator(periods: number): this;
  chandeForecastOscillator(name: string): this;
  chandeForecastOscillator(name: string, periods: number): this;
  chandeForecastOscillator(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "cfo", 14, (periods) => new ChandeForecastOscillatorRTIndicator(periods));
  }

  /** Fisher transform of the group's price over 10 periods, registered as `fisher10`. `periods` is at least 2. */
  fisherTransform(): this;
  fisherTransform(periods: number): this;
  fisherTransform(name: string): this;
  fisherTransform(name: string, periods: number): this;
  fisherTransform(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "fisher", 10, (periods) => new FisherTransformRTIndicator(periods));
  }

  /** TRIX of the group's price over 15 periods, registered as `trix15`. */
  trix(): this;
  trix(periods: number): this;
  trix(name: string): this;
  trix(name: string, periods: number): this;
  trix(...args: [] | [number] | [string] | [string, number]): this {
    return this.periodic(args, "trix", 15, (periods) => new TrixRTIndicator(periods));
  }

  /**
   * Connors RSI of the group's price with the standard (3, 2, 100) parameters, registered as `crsi3_2_100`,
   * or as `crsi` + RSI period + `_` + streak RSI period + `_` + rank period. `rsiPeriod` is the period of
   * the RSI of the price, at least 1; `streakRsiPeriod` the period of the RSI of the streak of up and down
   * closes, at least 1; `rankPeriod` the window of the percent rank of the rate of change, at least 2.
   */
  connorsRsi(): this;
  connorsRsi(rsiPeriod: number, streakRsiPeriod: number, rankPeriod: number): this;
  connorsRsi(name: string): this;
  connorsRsi(name: string, rsiPeriod: number, streakRsiPeriod: number, rankPeriod: number): this;
  connorsRsi(...args: [] | [string] | [number, number, number] | [string, number, number, number]): this {
    return this.shaped(
      args,
      [3, 2, 100],
      (rsiPeriod, streakRsiPeriod, rankPeriod) => `crsi${rsiPeriod}_${streakRsiPeriod}_${rankPeriod}`,
      (name, rsiPeriod, streakRsiPeriod, rankPeriod) => {
        this.target.add(
          name,
          new ConnorsRsiRTIndicator(rsiPeriod, streakRsiPeriod, rankPeriod)
            .withMeta("rsiPeriod", rsiPeriod)
            .withMeta("streakRsiPeriod", streakRsiPeriod)
            .withMeta("rankPeriod", rankPeriod),
        );
      },
    );
  }

  /**
   * Coppock curve of the group's price with the standard (14, 11, 10) parameters, registered as
   * `coppock14_11_10`, or as `coppock` + long ROC + `_` + short ROC + `_` + WMA period. `longRoc` and
   * `shortRoc` are the lookbacks of the two rates of change, `wmaPeriod` the period of the weighted moving
   * average of their sum; each is at least 1.
   */
  coppockCurve(): this;
  coppockCurve(longRoc: number, shortRoc: number, wmaPeriod: number): this;
  coppockCurve(name: string): this;
  coppockCurve(name: string, longRoc: number, shortRoc: number, wmaPeriod: number): this;
  coppockCurve(...args: [] | [string] | [number, number, number] | [string, number, number, number]): this {
    return this.shaped(
      args,
      [14, 11, 10],
      (longRoc, shortRoc, wmaPeriod) => `coppock${longRoc}_${shortRoc}_${wmaPeriod}`,
      (name, longRoc, shortRoc, wmaPeriod) => {
        this.target.add(
          name,
          new CoppockCurveRTIndicator(longRoc, shortRoc, wmaPeriod)
            .withMeta("longRoc", longRoc)
            .withMeta("shortRoc", shortRoc)
            .withMeta("wmaPeriod", wmaPeriod),
        );
      },
    );
  }

  /**
   * Adaptive Fisher transform of the group's price with the standard (10, 5, 20) parameters, registered as
   * `afisher10_5_20`, or as `afisher` + efficiency ratio period + `_` + minimum period + `_` + maximum
   * period. The efficiency ratio and the adaptive period it works from are diagnostics of the class, not
   * outputs. `erPeriod` is the lookback of the efficiency ratio, at least 1 and below `maxPeriod`;
   * `minPeriod` the shortest normalization window, at least 2 and at most `maxPeriod`; `maxPeriod` the
   * longest.
   */
  adaptiveFisherTransform(): this;
  adaptiveFisherTransform(erPeriod: number, minPeriod: number, maxPeriod: number): this;
  adaptiveFisherTransform(name: string): this;
  adaptiveFisherTransform(name: string, erPeriod: number, minPeriod: number, maxPeriod: number): this;
  adaptiveFisherTransform(...args: [] | [string] | [number, number, number] | [string, number, number, number]): this {
    return this.shaped(
      args,
      [10, 5, 20],
      (erPeriod, minPeriod, maxPeriod) => `afisher${erPeriod}_${minPeriod}_${maxPeriod}`,
      (name, erPeriod, minPeriod, maxPeriod) => {
        this.target.add(
          name,
          new AdaptiveFisherTransformRTIndicator(erPeriod, minPeriod, maxPeriod)
            .withMeta("erPeriod", erPeriod)
            .withMeta("minPeriod", minPeriod)
            .withMeta("maxPeriod", maxPeriod),
        );
      },
    );
  }

  /**
   * True strength index of the group's price with the standard (25, 13) periods, registered as `tsi25_13`,
   * or as `tsi` + long period + `_` + short period. `longPeriod` is the period of the first smoothing and
   * `shortPeriod` that of the second, each at least 1.
   */
  trueStrengthIndex(): this;
  trueStrengthIndex(longPeriod: number, shortPeriod: number): this;
  trueStrengthIndex(name: string): this;
  trueStrengthIndex(name: string, longPeriod: number, shortPeriod: number): this;
  trueStrengthIndex(...args: [] | [string] | [number, number] | [string, number, number]): this {
    return this.shaped(
      args,
      [25, 13],
      (longPeriod, shortPeriod) => `tsi${longPeriod}_${shortPeriod}`,
      (name, longPeriod, shortPeriod) => {
        this.target.add(
          name,
          new TrueStrengthIndexRTIndicator(longPeriod, shortPeriod)
            .withMeta("longPeriod", longPeriod)
            .withMeta("shortPeriod", shortPeriod),
        );
      },
    );
  }

  /**
   * Know Sure Thing of the group's price with the class defaults, registered as `kst`: rates of change over
   * 10, 15, 20 and 30 periods, smoothed over 10, 10, 10 and 15 and weighted 1 to 4. The indicator itself is
   * the KST line; its signal line, the SMA of 9 periods of the KST, is the other output. The parameters are
   * arrays, so no id is built from them: the form with parameters needs a name.
   *
   * `rocPeriods` is the lookback of each rate of change, e.g. `[10, 15, 20, 30]`: at least one, each at least
   * 1. `smaPeriods` is the smoothing period of each rate of change, at least 1, as many as `rocPeriods`.
   * `weights` is the finite weight of each smoothed rate of change, as many as `rocPeriods`. `signalPeriod`
   * is the period of the signal line, at least 1; the default is 9. The class copies the weights and keeps
   * none of the other arrays.
   */
  knowSureThing(): this;
  knowSureThing(name: string): this;
  knowSureThing(
    name: string,
    rocPeriods: readonly number[],
    smaPeriods: readonly number[],
    weights: readonly number[],
    signalPeriod: number,
  ): this;
  knowSureThing(
    ...args: [] | [string] | [string, readonly number[], readonly number[], readonly number[], number]
  ): this {
    const name = args[0] ?? "kst";
    // The class defaults (ROC periods, smoothing periods and weights as above, signal period 9), left as they are
    const kst =
      args.length === 5 ? new KnowSureThingRTIndicator(args[1], args[2], args[3], args[4]) : new KnowSureThingRTIndicator();
    kst.withMeta("signalPeriod", args.length === 5 ? args[4] : 9);
    return this.withOutputs(name, kst, output(Pro.SUFFIX_SIGNAL, () => kst.getSignal(), kst, DisplayHint.ABSOLUTE));
  }

  /**
   * The four shapes of a factory whose class has a no-argument constructor, `()`, `(...params)`, `(name)`
   * and `(name, ...params)`: the id of the forms without a name is built from the parameters, and the
   * parameters are the defaults of the class when none is given.
   */
  private shaped(
    args: readonly unknown[],
    defaults: readonly number[],
    idOf: (...params: number[]) => string,
    register: (name: string, ...params: number[]) => void,
  ): this {
    const named = typeof args[0] === "string";
    const given = (named ? args.slice(1) : args) as number[];
    const params = given.length === 0 ? [...defaults] : given;
    register(named ? (args[0] as string) : idOf(...params), ...params);
    return this;
  }

  /** The four shapes of a factory with a single period: `()`, `(periods)`, `(name)` and `(name, periods)`. */
  private periodic(
    args: [] | [number] | [string] | [string, number],
    prefix: string,
    defaultPeriods: number,
    create: (periods: number) => AbstractRTIndicator,
  ): this {
    return this.shaped(
      args,
      [defaultPeriods],
      (periods) => `${prefix}${periods}`,
      (name, periods) => {
        this.target.add(name, create(periods).withMeta("periods", periods));
      },
    );
  }

  private withOutputs(name: string, main: RTIndicator, ...outputs: Output[]): this {
    this.target.add(name, main);
    for (const { suffix, view } of outputs) {
      this.target.add(name + suffix, view);
    }
    return this;
  }
}

interface Output {
  suffix: string;
  view: ProOutput;
}

const LONG_MAX = 9223372036854775807n;
const LONG_MIN = -9223372036854775808n;

/**
 * A number in an id as the Java engine's `Pro` writes it: a whole value as a long, without its decimal part (`5`,
 * not `5.0`), and any other as `Double.toString` does (`2.5`, `1.0E-4`).
 */
function numberName(value: number): string {
  if (Number.isInteger(value)) {
    const whole = BigInt(value);
    return String(whole > LONG_MAX ? LONG_MAX : whole < LONG_MIN ? LONG_MIN : whole);
  }
  return javaDouble(value);
}

function output(suffix: string, read: () => number, owner: RTIndicator, hint: DisplayHint): Output {
  const view = new ProOutput(read, () => owner.isReady());
  view.withMeta("output", suffix.toLowerCase()).withDisplayHint(hint);
  return { suffix, view };
}
