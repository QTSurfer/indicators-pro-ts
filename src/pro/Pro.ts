import { DisplayHint, type InstrumentGroupRTIndicator, type RTIndicator } from "@qtsurfer/indicators";
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
 * `rollingPercentile`, `simpleLinearRegression`, `skewness`, `valueAtRisk` and `zScore`) and the risk
 * ones (`calmarRatio`, `maxDrawdown`, `omegaRatio`, `sharpeRatio`, `sortinoRatio`, `tailRatio`,
 * `ulcerIndex`, `ewmaVolatility` and `realizedVolatility`) read the group's price, as the base
 * indicators do: they work on a ticker feed too.
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

function output(suffix: string, read: () => number, owner: RTIndicator, hint: DisplayHint): Output {
  const view = new ProOutput(read, () => owner.isReady());
  view.withMeta("output", suffix.toLowerCase()).withDisplayHint(hint);
  return { suffix, view };
}
