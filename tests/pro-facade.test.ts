import { describe, it, expect } from "vitest";
import {
  DisplayHint,
  InstrumentGroupRTIndicator,
  InstrumentMapKlineSourceRTIndicator,
  InstrumentMapTickerSourceRTIndicator,
} from "@qtsurfer/indicators";
import {
  AdaptiveFisherTransformRTIndicator,
  AdxRTIndicator,
  AlmaRTIndicator,
  AutocorrelationRTIndicator,
  CalmarRatioRTIndicator,
  ChandeForecastOscillatorRTIndicator,
  CmoRTIndicator,
  ConnorsRsiRTIndicator,
  CoppockCurveRTIndicator,
  DemaRTIndicator,
  DetrendedPriceOscillatorRTIndicator,
  EnvelopesRTIndicator,
  EwmaVolatilityRTIndicator,
  FisherTransformRTIndicator,
  FramaRTIndicator,
  HurstExponentRTIndicator,
  IchimokuRTIndicator,
  KnowSureThingRTIndicator,
  KurtosisRTIndicator,
  LeastSquaresMovingAverageRTIndicator,
  LinearRegressionSlopeRTIndicator,
  MaxDrawdownRTIndicator,
  McGinleyDynamicRTIndicator,
  MomentumRTIndicator,
  OmegaRatioRTIndicator,
  Pro,
  RealizedVolatilityRTIndicator,
  RocRTIndicator,
  RollingPercentileRTIndicator,
  SharpeRatioRTIndicator,
  SimpleLinearRegressionRTIndicator,
  SkewnessRTIndicator,
  SortinoRatioRTIndicator,
  TailRatioRTIndicator,
  TrixRTIndicator,
  TrueStrengthIndexRTIndicator,
  UlcerIndexRTIndicator,
  ValueAtRiskRTIndicator,
  YangZhangVolatilityRTIndicator,
  ZScoreRTIndicator,
} from "../src";
import { LOG_TOLERANCE, expectSeries } from "./compare";
import { inputsOf, klines, reference } from "./fixtures";

const INSTRUMENT = "BTC/USDT";

function klineGroup(): { map: InstrumentMapKlineSourceRTIndicator; group: InstrumentGroupRTIndicator } {
  const map = new InstrumentMapKlineSourceRTIndicator(INSTRUMENT);
  return { map, group: new InstrumentGroupRTIndicator(map) };
}

describe("every factory of the Java engine's Pro is here", () => {
  it("with its default id", () => {
    const { group } = klineGroup();
    Pro.on(group).adx().mfi().cmf().obv().vwap().superTrend().ichimoku().kurtosis(20).parkinson(20).garmanKlass(20).rogersSatchell(20).yangZhang(20);
    for (const name of [
      "adx14", "mfi14", "cmf20", "obv", "vwap", "st10_3", "ichi9_26_52", "kurt20", "park20", "gk20", "rs20", "yz20",
      "st10_3Upper", "st10_3Lower",
    ]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
  });

  it("and a SuperTrend id built from its parameters, a whole multiplier without its decimal part", () => {
    const { group } = klineGroup();
    Pro.on(group).superTrend(14, 2.0).superTrend(10, 2.5).superTrend("mine", 7, 1.5);
    for (const name of ["st14_2", "st14_2Upper", "st10_2.5", "mine", "mineLower"]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
  });

  it("with the display hints and parameters Java gives", () => {
    const { group } = klineGroup();
    Pro.on(group).obv().mfi().cmf();
    expect(group.getExisting("obv").getDisplayHint!()).toBe(DisplayHint.VOLUME);
    expect(group.getExisting("mfi14").getDisplayHint!()).toBe(DisplayHint.PERCENT);
    expect(group.getExisting("cmf20").getDisplayHint!()).toBe(DisplayHint.ABSOLUTE);
  });
});

describe("the ids the facade registers, as the Java engine's Pro gives them", () => {
  it("defaults", () => {
    const { group } = klineGroup();
    Pro.on(group).adx().ichimoku().vwap().kurtosis(20).yangZhang(20);
    for (const name of ["adx14", "ichi9_26_52", "vwap", "kurt20", "yz20"]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
  });

  it("the outputs of an indicator that has several, beside it", () => {
    const { group } = klineGroup();
    Pro.on(group).adx().ichimoku();
    for (const name of [
      "adx14PlusDI", "adx14MinusDI",
      "ichi9_26_52Kijun", "ichi9_26_52SenkouA", "ichi9_26_52SenkouB", "ichi9_26_52Chikou",
    ]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
    expect(group.getExisting("ichi9_26_52Kijun").getMeta!().get("output")).toBe("kijun");
    expect(group.getExisting("adx14PlusDI").getDisplayHint!()).toBe(DisplayHint.PERCENT);
  });

  it("parameters and names", () => {
    const { group } = klineGroup();
    Pro.on(group).adx(7).adx("trend", 21).ichimoku(7, 22, 44).ichimoku("cloud").yangZhang("vol", 10, Math.sqrt(252)).kurtosis("k", 8);
    for (const name of ["adx7", "trend", "trendPlusDI", "ichi7_22_44", "cloud", "cloudKijun", "vol", "k"]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
    expect(group.getExisting("ichi7_22_44").getMeta!().get("kijunPeriod")).toBe("22");
    expect(group.getExisting("trend").getMeta!().get("periods")).toBe("21");
  });

  it("the indicators say they need bars", () => {
    expect(new AdxRTIndicator().requiresBarData()).toBe(true);
    expect(new IchimokuRTIndicator().requiresBarData()).toBe(true);
    expect(new YangZhangVolatilityRTIndicator(20).requiresBarData()).toBe(true);
  });
});

describe("a kline group of the facade's indicators", () => {
  it("gives, bar after bar, the values the Java engine gives", () => {
    const { map, group } = klineGroup();
    Pro.on(group)
      .adx().ichimoku().vwap().yangZhang(20)
      .obv().mfi().cmf().superTrend().parkinson(20).garmanKlass(20).rogersSatchell(20);
    const expected = reference.scenarios.clean;
    const names = {
      adx14: expected.adx14.main, adx14PlusDI: expected.adx14.plusDI, adx14MinusDI: expected.adx14.minusDI,
      "ichi9_26_52": expected.ichimoku.tenkan, ichi9_26_52Kijun: expected.ichimoku.kijun,
      ichi9_26_52SenkouA: expected.ichimoku.senkouA, ichi9_26_52SenkouB: expected.ichimoku.senkouB,
      ichi9_26_52Chikou: expected.ichimoku.chikou, vwap: expected.vwap, yz20: expected.yangZhang20,
      obv: expected.obv, mfi14: expected.mfi14, cmf20: expected.cmf20,
      st10_3: expected.superTrend.main, st10_3Upper: expected.superTrend.upper, st10_3Lower: expected.superTrend.lower,
      park20: expected.parkinson20, gk20: expected.garmanKlass20, rs20: expected.rogersSatchell20,
    } as Record<string, (number | null)[]>;
    const actual: Record<string, number[]> = Object.fromEntries(Object.keys(names).map((name) => [name, []]));
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      for (const name of Object.keys(names)) {
        actual[name]!.push(group.getIndicatorValue(name));
      }
    }
    // The estimators take logarithms, which an x86-64 build of V8 can round one bit differently from the Java
    // engine's; every other series is equal to the last bit
    const takesLogarithms = new Set(["yz20", "park20", "gk20", "rs20"]);
    for (const [name, series] of Object.entries(names)) {
      expectSeries(actual[name]!, series, name, takesLogarithms.has(name) ? LOG_TOLERANCE : 0);
    }
  });

  it("holds the bar readers on a bar with a price that is not finite, as the Java kline map does", () => {
    const { map, group } = klineGroup();
    Pro.on(group).adx().vwap();
    const inputs = inputsOf("clean");
    const bars = klines(inputs);
    const twin = klineGroup();
    Pro.on(twin.group).adx().vwap();
    bars.slice(0, 120).forEach((bar) => {
      map.updateFrom(bar);
      twin.map.updateFrom(bar);
    });
    map.updateFrom({ ...bars[120], high: NaN });
    expect(group.getIndicatorValue("adx14")).toBe(twin.group.getIndicatorValue("adx14"));
    expect(group.getIndicatorValue("vwap")).toBe(twin.group.getIndicatorValue("vwap"));
  });

  it("feeds a kurtosis the close, through the scalar path", () => {
    const { map, group } = klineGroup();
    Pro.on(group).kurtosis(20);
    const direct = new KurtosisRTIndicator(20);
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      direct.update(bar.close);
      expect(group.getIndicatorValue("kurt20")).toBe(direct.getValue());
    }
  });
});

describe("the statistics factories, as the Java engine's Pro gives them", () => {
  it("default ids, and the outputs beside the indicator", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .autocorrelation(20).hurstExponent(20).linearRegressionSlope(20).rollingPercentile(20, 0.95)
      .simpleLinearRegression(20).skewness(20).valueAtRisk(20).zScore(20);
    for (const name of [
      "acf20", "hurst20", "lrs20", "lrs20Intercept", "pctl20_0.95", "pctl20_0.95Median", "pctl20_0.95Min",
      "pctl20_0.95Max", "slr20", "slr20Intercept", "slr20RSquared", "slr20StandardError", "skew20", "valRisk20",
      "zscore20",
    ]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
  });

  it("a whole percentile drops its decimal part in the id, as a whole Bollinger multiplier does", () => {
    const { group } = klineGroup();
    Pro.on(group).rollingPercentile(20, 1.0).rollingPercentile(10, 0.5);
    expect(group.getExisting("pctl20_1")).toBeDefined();
    expect(group.getExisting("pctl10_0.5Median")).toBeDefined();
  });

  it("names, parameters and metadata", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .autocorrelation("a", 8).hurstExponent("h", 9).linearRegressionSlope("s", 10)
      .rollingPercentile("p", 11, 0.25).simpleLinearRegression("r", 12).skewness("k", 13)
      .valueAtRisk("v", 14).valueAtRisk("v99", 15, 0.99).zScore("z", 16);
    for (const [name, periods] of [["a", 8], ["h", 9], ["s", 10], ["p", 11], ["r", 12], ["k", 13], ["v", 14], ["v99", 15], ["z", 16]] as const) {
      expect(group.getExisting(name).getMeta!().get("periods"), name).toBe(String(periods));
    }
    expect(group.getExisting("sIntercept")).toBeDefined();
    expect(group.getExisting("rStandardError")).toBeDefined();
    expect(group.getExisting("p").getMeta!().get("percentile")).toBe("0.25");
    expect(group.getExisting("v").getMeta!().get("confidence")).toBe("0.95");
    expect(group.getExisting("v99").getMeta!().get("confidence")).toBe("0.99");
    expect(group.getExisting("pMedian").getMeta!().get("output")).toBe("median");
    expect(group.getExisting("rRSquared").getDisplayHint!()).toBe(DisplayHint.ABSOLUTE);
  });

  it("the constructor limits come through the factory", () => {
    const { group } = klineGroup();
    expect(() => Pro.on(group).autocorrelation(3)).toThrow(RangeError);
    expect(() => Pro.on(group).skewness(2)).toThrow(RangeError);
    expect(() => Pro.on(group).rollingPercentile(20, 1.5)).toThrow(RangeError);
    expect(() => Pro.on(group).valueAtRisk("v", 20, 1)).toThrow(RangeError);
  });

  it("the two 95% forms of Value at Risk differ, as in the Java engine", () => {
    const { map, group } = klineGroup();
    Pro.on(group).valueAtRisk("short", 20).valueAtRisk("long", 20, 0.95);
    const byDefault = new ValueAtRiskRTIndicator(20);
    const viaInverse = new ValueAtRiskRTIndicator(20).withConfidenceLevel(0.95);
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      byDefault.update(bar.close);
      viaInverse.update(bar.close);
    }
    expect(group.getIndicatorValue("short")).toBe(byDefault.getValue());
    expect(group.getIndicatorValue("long")).toBe(viaInverse.getValue());
    expect(group.getIndicatorValue("short")).not.toBe(group.getIndicatorValue("long"));
  });

  it("a kline group gives, bar after bar, what each class gives on the close, outputs included", () => {
    const { map, group } = klineGroup();
    Pro.on(group)
      .autocorrelation(20).hurstExponent(20).linearRegressionSlope(20).rollingPercentile(20, 0.95)
      .simpleLinearRegression(20).skewness(20).valueAtRisk("v99", 20, 0.99, 252).zScore(20);
    const acf = new AutocorrelationRTIndicator(20);
    const hurst = new HurstExponentRTIndicator(20);
    const slope = new LinearRegressionSlopeRTIndicator(20);
    const pctl = new RollingPercentileRTIndicator(20, 0.95);
    const slr = new SimpleLinearRegressionRTIndicator(20);
    const skew = new SkewnessRTIndicator(20);
    const valueAtRisk = new ValueAtRiskRTIndicator(20).withConfidenceLevel(0.99).withAnnualizationFactor(252);
    const zScore = new ZScoreRTIndicator(20);
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      const close = bar.close;
      const expected: Record<string, number> = {
        acf20: acf.update(close),
        hurst20: hurst.update(close),
        lrs20: slope.update(close),
        lrs20Intercept: slope.getIntercept(),
        "pctl20_0.95": pctl.update(close),
        "pctl20_0.95Median": pctl.getMedian(),
        "pctl20_0.95Min": pctl.getMin(),
        "pctl20_0.95Max": pctl.getMax(),
        slr20: slr.update(close),
        slr20Intercept: slr.getIntercept(),
        slr20RSquared: slr.getRSquared(),
        slr20StandardError: slr.getStandardError(),
        skew20: skew.update(close),
        v99: valueAtRisk.update(close),
        zscore20: zScore.update(close),
      };
      for (const [name, value] of Object.entries(expected)) {
        expect(group.getIndicatorValue(name), name).toBe(value);
      }
    }
  });

  it("reads the price of a ticker feed too, and raises no notice, unlike a bar reader", () => {
    const map = new InstrumentMapTickerSourceRTIndicator(INSTRUMENT);
    const group = new InstrumentGroupRTIndicator(map);
    Pro.on(group).skewness(20).zScore(20).linearRegressionSlope(20);
    const bars = klines(inputsOf("clean"));
    for (const bar of bars.slice(0, 60)) {
      map.updateFrom({
        instrument: INSTRUMENT, open: null, high: null, low: null, last: bar.close, bid: null, bidSize: null,
        ask: null, askSize: null, volume: null, quoteVolume: null, vwap: null, percentageChange: null,
        timestamp: bar.timestamp,
      });
    }
    expect(group.getNotices()).toEqual([]);
    expect(group.getIndicatorValue("zscore20")).not.toBe(0);

    const readers = new InstrumentMapTickerSourceRTIndicator(INSTRUMENT);
    const readersGroup = new InstrumentGroupRTIndicator(readers);
    Pro.on(readersGroup).adx();
    readers.updateFrom({
      instrument: INSTRUMENT, open: 1, high: 2, low: 1, last: 1.5, bid: null, bidSize: null, ask: null, askSize: null,
      volume: 1, quoteVolume: null, vwap: null, percentageChange: null, timestamp: 1,
    });
    expect(readersGroup.getNotices()).toHaveLength(1);
  });
});

describe("the risk factories, as the Java engine's Pro gives them", () => {
  it("default ids, and the outputs beside the indicator", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .calmarRatio(20).maxDrawdown().omegaRatio(20).sharpeRatio(20).sortinoRatio(20).tailRatio(20).ulcerIndex(20)
      .ewmaVolatility().realizedVolatility(20);
    for (const name of [
      "calmar20", "maxDd", "maxDdCurrent", "omega20", "sharpe20", "sortino20", "tail20", "ulcer20", "ewma0.94", "rvol20",
    ]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
  });

  it("the EWMA id is its lambda, and every form of it registers", () => {
    const { group } = klineGroup();
    Pro.on(group).ewmaVolatility(0.97).ewmaVolatility("slow").ewmaVolatility("fast", 0.9).ewmaVolatility("annual", 0.94, 252);
    for (const name of ["ewma0.97", "slow", "fast", "annual"]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
    expect(group.getExisting("ewma0.97").getMeta!().get("lambda")).toBe("0.97");
    expect(group.getExisting("slow").getMeta!().get("lambda")).toBe("0.94");
    expect(() => Pro.on(group).ewmaVolatility("bad", 1)).toThrow(RangeError);
  });

  it("names, options and metadata", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .calmarRatio("c", 10, 365).maxDrawdown("dd").omegaRatio("o", 11, 0.001).sharpeRatio("s", 12, 0.0001, Math.sqrt(252))
      .sortinoRatio("so", 13, 0.001, Math.sqrt(252)).tailRatio("t", 14, 0.9, 0.1).ulcerIndex("u", 15).realizedVolatility("r", 16, 365);
    for (const [name, periods] of [["c", 10], ["o", 11], ["s", 12], ["so", 13], ["t", 14], ["u", 15], ["r", 16]] as const) {
      expect(group.getExisting(name).getMeta!().get("periods"), name).toBe(String(periods));
    }
    expect(group.getExisting("ddCurrent")).toBeDefined();
    expect(group.getExisting("o").getMeta!().get("threshold")).toBe("0.001");
    expect(group.getExisting("s").getMeta!().get("riskFreeRate")).toBe("0.0001");
    expect(group.getExisting("so").getMeta!().get("mar")).toBe("0.001");
    expect(group.getExisting("t").getMeta!().get("upper")).toBe("0.9");
    expect(group.getExisting("t").getMeta!().get("lower")).toBe("0.1");
    expect(group.getExisting("u").getDisplayHint!()).toBe(DisplayHint.PERCENT);
    expect(group.getExisting("ddCurrent").getMeta!().get("output")).toBe("current");
  });

  it("the constructor limits come through the factory", () => {
    const { group } = klineGroup();
    expect(() => Pro.on(group).calmarRatio(1)).toThrow(RangeError);
    expect(() => Pro.on(group).tailRatio("t", 20, 1.2, 0.05)).toThrow(RangeError);
    expect(() => Pro.on(group).ulcerIndex(0)).toThrow(RangeError);
  });

  it("a kline group gives, bar after bar, what each class gives on the close, options and outputs included", () => {
    const { map, group } = klineGroup();
    Pro.on(group)
      .calmarRatio(20).calmarRatio("calmar365", 20, 365).maxDrawdown().omegaRatio(20).omegaRatio("omegaT", 20, 0.001)
      .sharpeRatio(20).sharpeRatio("sharpeR", 20, 0.0001, Math.sqrt(252)).sortinoRatio(20)
      .sortinoRatio("sortinoM", 20, 0.001, Math.sqrt(252)).tailRatio(20).tailRatio("tail90", 20, 0.9, 0.1).ulcerIndex(20)
      .ewmaVolatility().ewmaVolatility("ewma97", 0.97, 252).realizedVolatility(20).realizedVolatility("rvol365", 20, 365);
    const calmar = new CalmarRatioRTIndicator(20);
    const calmar365 = new CalmarRatioRTIndicator(20).withAnnualizationFactor(365);
    const drawdown = new MaxDrawdownRTIndicator();
    const omega = new OmegaRatioRTIndicator(20);
    const omegaT = new OmegaRatioRTIndicator(20).withThreshold(0.001);
    const sharpe = new SharpeRatioRTIndicator(20);
    const sharpeR = new SharpeRatioRTIndicator(20).withRiskFreeRate(0.0001).withAnnualizationFactor(Math.sqrt(252));
    const sortino = new SortinoRatioRTIndicator(20);
    const sortinoM = new SortinoRatioRTIndicator(20).withMAR(0.001).withAnnualizationFactor(Math.sqrt(252));
    const tail = new TailRatioRTIndicator(20);
    const tail90 = new TailRatioRTIndicator(20).withPercentiles(0.9, 0.1);
    const ulcer = new UlcerIndexRTIndicator(20);
    const ewma = new EwmaVolatilityRTIndicator();
    const ewma97 = new EwmaVolatilityRTIndicator(0.97).withAnnualizationFactor(252);
    const realized = new RealizedVolatilityRTIndicator(20);
    const rvol365 = new RealizedVolatilityRTIndicator(20).withAnnualizationFactor(365);
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      const close = bar.close;
      const expected: Record<string, number> = {
        calmar20: calmar.update(close), calmar365: calmar365.update(close),
        maxDd: drawdown.update(close), maxDdCurrent: drawdown.getCurrentDrawdown(),
        omega20: omega.update(close), omegaT: omegaT.update(close),
        sharpe20: sharpe.update(close), sharpeR: sharpeR.update(close),
        sortino20: sortino.update(close), sortinoM: sortinoM.update(close),
        tail20: tail.update(close), tail90: tail90.update(close),
        ulcer20: ulcer.update(close),
        "ewma0.94": ewma.update(close), ewma97: ewma97.update(close),
        rvol20: realized.update(close), rvol365: rvol365.update(close),
      };
      for (const [name, value] of Object.entries(expected)) {
        expect(group.getIndicatorValue(name), name).toBe(value);
      }
    }
  });

  it("reads the price of a ticker feed too, and raises no notice", () => {
    const map = new InstrumentMapTickerSourceRTIndicator(INSTRUMENT);
    const group = new InstrumentGroupRTIndicator(map);
    Pro.on(group).sharpeRatio(20).maxDrawdown().ulcerIndex(20).ewmaVolatility();
    for (const bar of klines(inputsOf("clean")).slice(0, 80)) {
      map.updateFrom({
        instrument: INSTRUMENT, open: null, high: null, low: null, last: bar.close, bid: null, bidSize: null,
        ask: null, askSize: null, volume: null, quoteVolume: null, vwap: null, percentageChange: null,
        timestamp: bar.timestamp,
      });
    }
    expect(group.getNotices()).toEqual([]);
    expect(group.getIndicatorValue("ulcer20")).toBeGreaterThan(0);
  });
});

describe("the averages and momentum factories, as the Java engine's Pro gives them", () => {
  const tickerOf = (last: number, timestamp: number) => ({
    instrument: INSTRUMENT, open: null, high: null, low: null, last, bid: null, bidSize: null,
    ask: null, askSize: null, volume: null, quoteVolume: null, vwap: null, percentageChange: null, timestamp,
  });

  it("default ids, and the outputs beside the indicator", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .alma(20).dema(20).envelopes().frama().leastSquaresMovingAverage().mcGinleyDynamic().momentum().roc().cmo()
      .detrendedPriceOscillator().chandeForecastOscillator().connorsRsi().coppockCurve().fisherTransform()
      .adaptiveFisherTransform().knowSureThing().trix().trueStrengthIndex();
    for (const name of [
      "alma20", "dema20", "env20_2.5", "env20_2.5Upper", "env20_2.5Lower", "frama20", "lsma25", "mcg14", "mom10", "roc12",
      "cmo14", "dpo20", "cfo14", "crsi3_2_100", "coppock14_11_10", "fisher10", "afisher10_5_20", "kst", "kstSignal",
      "trix15", "tsi25_13",
    ]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
    expect(group.getExisting("env20_2.5Upper").getMeta!().get("output")).toBe("upper");
    expect(group.getExisting("kstSignal").getMeta!().get("output")).toBe("signal");
    expect(group.getExisting("kstSignal").getDisplayHint!()).toBe(DisplayHint.ABSOLUTE);
    expect(group.getExisting("env20_2.5Lower").getDisplayHint!()).toBe(DisplayHint.ABSOLUTE);
    expect(Pro.SUFFIX_SIGNAL).toBe("Signal");
  });

  it("registers no other output: the diagnostics of the classes stay out", () => {
    const { group } = klineGroup();
    Pro.on(group).frama().chandeForecastOscillator().adaptiveFisherTransform().alma(10).knowSureThing();
    const registered: string[] = [];
    group.indicators.forEachPublicable((name) => registered.push(name));
    expect(registered.sort()).toEqual(["afisher10_5_20", "alma10", "cfo14", "frama20", "kst", "kstSignal"]);
  });

  it("the four shapes of a factory with one period: the default, the period, a name, a name and a period", () => {
    const { group } = klineGroup();
    const factories = [
      ["leastSquaresMovingAverage", "lsma", 25], ["mcGinleyDynamic", "mcg", 14], ["momentum", "mom", 10],
      ["roc", "roc", 12], ["cmo", "cmo", 14], ["detrendedPriceOscillator", "dpo", 20],
      ["chandeForecastOscillator", "cfo", 14], ["fisherTransform", "fisher", 10], ["trix", "trix", 15], ["frama", "frama", 20],
    ] as const;
    const pro = Pro.on(group) as unknown as Record<string, (...args: (string | number)[]) => unknown>;
    for (const [method, prefix, periods] of factories) {
      pro[method]!();
      pro[method]!(7);
      pro[method]!(`${method}Named`);
      pro[method]!(`${method}Both`, 9);
      const expected: [string, number][] = [[`${prefix}${periods}`, periods], [`${prefix}7`, 7], [`${method}Named`, periods], [`${method}Both`, 9]];
      for (const [name, value] of expected) {
        expect(group.getExisting(name).getMeta!().get("periods"), name).toBe(String(value));
      }
    }
  });

  it("ALMA has no form without a period; its options are in the metadata, the defaults on the short forms", () => {
    const { group } = klineGroup();
    // the type checker refuses a call without a period (the closure never runs)
    // @ts-expect-error alma() has no no-argument form
    const withoutPeriod = () => Pro.on(group).alma();
    expect(withoutPeriod).toBeTypeOf("function");
    Pro.on(group).alma(20).alma("a", 10).alma("tuned", 14, 0.5, 4);
    for (const [name, periods, offsetFactor, sigmaFactor] of [
      ["alma20", 20, 0.85, 6], ["a", 10, 0.85, 6], ["tuned", 14, 0.5, 4],
    ] as const) {
      const meta = group.getExisting(name).getMeta!();
      expect(meta.get("periods"), name).toBe(String(periods));
      expect(meta.get("offsetFactor"), name).toBe(String(offsetFactor));
      expect(meta.get("sigmaFactor"), name).toBe(String(sigmaFactor));
    }
  });

  it("DEMA takes a period or a name and a period", () => {
    const { group } = klineGroup();
    Pro.on(group).dema(20).dema("d", 9);
    expect(group.getExisting("dema20").getMeta!().get("periods")).toBe("20");
    expect(group.getExisting("d").getMeta!().get("periods")).toBe("9");
  });

  it("the envelopes id is its periods and its percentage, a whole percentage without its decimal part", () => {
    const { group } = klineGroup();
    Pro.on(group).envelopes(20, 5).envelopes(10, 2.5).envelopes(15, 0.0005).envelopes("e").envelopes("w", 12, 3);
    for (const name of ["env20_5", "env20_5Upper", "env10_2.5", "env10_2.5Lower", "env15_5.0E-4", "e", "eUpper", "w", "wLower"]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
    expect(group.getExisting("env20_5").getMeta!().get("percentage")).toBe("5");
    expect(group.getExisting("e").getMeta!().get("periods")).toBe("20");
    expect(group.getExisting("e").getMeta!().get("percentage")).toBe("2.5");
    expect(group.getExisting("w").getMeta!().get("periods")).toBe("12");
  });

  it("the id of a very large percentage is the long Java casts it to", () => {
    const { group } = klineGroup();
    Pro.on(group).envelopes(20, 2 ** 60).envelopes(20, 1e19);
    expect(group.getExisting("env20_1152921504606846976")).toBeDefined();
    expect(group.getExisting("env20_9223372036854775807")).toBeDefined();
  });

  it("FRAMA takes the id and the metadata from the period asked for, though the class makes it even", () => {
    const { group } = klineGroup();
    Pro.on(group).frama(21).frama("odd", 5);
    expect(group.getExisting("frama21")).toBeInstanceOf(FramaRTIndicator);
    expect(group.getExisting("frama21").getMeta!().get("periods")).toBe("21");
    expect((group.getExisting("frama21") as FramaRTIndicator).periods).toBe(22);
    expect(group.getExisting("odd").getMeta!().get("periods")).toBe("5");
    expect(group.get("frama22")).toBeUndefined();
  });

  it("the parameters of the multi-parameter factories: ids, names and metadata", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .connorsRsi(5, 3, 50).connorsRsi("c", 4, 2, 20).connorsRsi("c0")
      .coppockCurve(10, 8, 5).coppockCurve("k", 12, 9, 6).coppockCurve("k0")
      .adaptiveFisherTransform(8, 4, 16).adaptiveFisherTransform("a", 6, 3, 12).adaptiveFisherTransform("a0")
      .trueStrengthIndex(20, 10).trueStrengthIndex("t", 30, 15).trueStrengthIndex("t0");
    const meta = (name: string) => Object.fromEntries(group.getExisting(name).getMeta!().asMap());
    expect(meta("crsi5_3_50")).toEqual({ rsiPeriod: "5", streakRsiPeriod: "3", rankPeriod: "50" });
    expect(meta("c")).toEqual({ rsiPeriod: "4", streakRsiPeriod: "2", rankPeriod: "20" });
    expect(meta("c0")).toEqual({ rsiPeriod: "3", streakRsiPeriod: "2", rankPeriod: "100" });
    expect(meta("coppock10_8_5")).toEqual({ longRoc: "10", shortRoc: "8", wmaPeriod: "5" });
    expect(meta("k")).toEqual({ longRoc: "12", shortRoc: "9", wmaPeriod: "6" });
    expect(meta("k0")).toEqual({ longRoc: "14", shortRoc: "11", wmaPeriod: "10" });
    expect(meta("afisher8_4_16")).toEqual({ erPeriod: "8", minPeriod: "4", maxPeriod: "16" });
    expect(meta("a")).toEqual({ erPeriod: "6", minPeriod: "3", maxPeriod: "12" });
    expect(meta("a0")).toEqual({ erPeriod: "10", minPeriod: "5", maxPeriod: "20" });
    expect(meta("tsi20_10")).toEqual({ longPeriod: "20", shortPeriod: "10" });
    expect(meta("t")).toEqual({ longPeriod: "30", shortPeriod: "15" });
    expect(meta("t0")).toEqual({ longPeriod: "25", shortPeriod: "13" });
  });

  it("Know sure thing: the id is kst, the arrays need a name, and only the signal period is in the metadata", () => {
    const { group } = klineGroup();
    const weights = [1, 2];
    Pro.on(group).knowSureThing().knowSureThing("k").knowSureThing("short", [5, 10], [5, 5], weights, 5);
    const meta = (name: string) => Object.fromEntries(group.getExisting(name).getMeta!().asMap());
    expect(meta("kst")).toEqual({ signalPeriod: "9" });
    expect(meta("k")).toEqual({ signalPeriod: "9" });
    expect(meta("short")).toEqual({ signalPeriod: "5" });
    expect(group.getExisting("shortSignal")).toBeDefined();
    expect(group.getExisting("kSignal")).toBeDefined();
  });

  it("Know sure thing: the factory clones no array, and the class copies the weights", () => {
    const { map, group } = klineGroup();
    const weights = [1, 2];
    Pro.on(group).knowSureThing("short", [5, 10], [5, 5], weights, 5);
    const direct = new KnowSureThingRTIndicator([5, 10], [5, 5], [1, 2], 5);
    weights[0] = 100;
    weights[1] = -100;
    for (const bar of klines(inputsOf("clean")).slice(0, 80)) {
      map.updateFrom(bar);
      direct.update(bar.close);
      expect(group.getIndicatorValue("short")).toBe(direct.getValue());
      expect(group.getIndicatorValue("shortSignal")).toBe(direct.getSignal());
    }
  });

  it("the constructor limits come through the factory", () => {
    const { group } = klineGroup();
    expect(() => Pro.on(group).alma(0)).toThrow(RangeError);
    expect(() => Pro.on(group).alma("a", 10, 1.5, 6)).toThrow(RangeError);
    expect(() => Pro.on(group).alma("a", 10, 0.85, 0)).toThrow(RangeError);
    expect(() => Pro.on(group).dema(0)).toThrow(RangeError);
    expect(() => Pro.on(group).envelopes(20, -1)).toThrow(RangeError);
    expect(() => Pro.on(group).frama(2)).toThrow(RangeError);
    expect(() => Pro.on(group).leastSquaresMovingAverage(1)).toThrow(RangeError);
    expect(() => Pro.on(group).detrendedPriceOscillator("d", 2)).toThrow(RangeError);
    expect(() => Pro.on(group).chandeForecastOscillator(1)).toThrow(RangeError);
    expect(() => Pro.on(group).fisherTransform(1)).toThrow(RangeError);
    expect(() => Pro.on(group).connorsRsi(3, 2, 1)).toThrow(RangeError);
    expect(() => Pro.on(group).coppockCurve(14, 0, 10)).toThrow(RangeError);
    expect(() => Pro.on(group).adaptiveFisherTransform(5, 6, 5)).toThrow(RangeError);
    expect(() => Pro.on(group).trueStrengthIndex(0, 13)).toThrow(RangeError);
    expect(() => Pro.on(group).knowSureThing("k", [10, 15], [10], [1, 2], 9)).toThrow(RangeError);
    expect(() => Pro.on(group).knowSureThing("k", [], [], [], 9)).toThrow(RangeError);
    expect(() => Pro.on(group).knowSureThing("k", [10, 15], [10, 10], [1, 2], 0)).toThrow(RangeError);
    // a factory that throws registers nothing
    const registered: string[] = [];
    group.indicators.forEachPublicable((name) => registered.push(name));
    expect(registered).toEqual([]);
  });

  it("a kline group gives, bar after bar, what each class gives on the close, options and outputs included", () => {
    const { map, group } = klineGroup();
    Pro.on(group)
      .alma(20).alma("almaTuned", 20, 0.5, 4).dema(20).envelopes().envelopes("envWide", 10, 5)
      .frama().frama(21).leastSquaresMovingAverage().mcGinleyDynamic().momentum().roc().cmo()
      .detrendedPriceOscillator().chandeForecastOscillator().fisherTransform().trix()
      .connorsRsi().connorsRsi("crsiFast", 5, 3, 50).coppockCurve().coppockCurve("coppockShort", 10, 8, 5)
      .adaptiveFisherTransform().adaptiveFisherTransform("afisherShort", 8, 4, 16)
      .trueStrengthIndex().trueStrengthIndex("tsiShort", 13, 7)
      .knowSureThing().knowSureThing("kstShort", [5, 10], [5, 5], [1, 2], 5);
    const alma = new AlmaRTIndicator(20);
    const almaTuned = new AlmaRTIndicator(20, 0.5, 4);
    const dema = new DemaRTIndicator(20);
    const envelopes = new EnvelopesRTIndicator();
    const envWide = new EnvelopesRTIndicator(10, 5);
    const frama = new FramaRTIndicator();
    const frama21 = new FramaRTIndicator(21);
    const lsma = new LeastSquaresMovingAverageRTIndicator();
    const mcg = new McGinleyDynamicRTIndicator();
    const mom = new MomentumRTIndicator();
    const roc = new RocRTIndicator();
    const cmo = new CmoRTIndicator();
    const dpo = new DetrendedPriceOscillatorRTIndicator();
    const cfo = new ChandeForecastOscillatorRTIndicator();
    const fisher = new FisherTransformRTIndicator();
    const trix = new TrixRTIndicator();
    const crsi = new ConnorsRsiRTIndicator();
    const crsiFast = new ConnorsRsiRTIndicator(5, 3, 50);
    const coppock = new CoppockCurveRTIndicator();
    const coppockShort = new CoppockCurveRTIndicator(10, 8, 5);
    const afisher = new AdaptiveFisherTransformRTIndicator();
    const afisherShort = new AdaptiveFisherTransformRTIndicator(8, 4, 16);
    const tsi = new TrueStrengthIndexRTIndicator();
    const tsiShort = new TrueStrengthIndexRTIndicator(13, 7);
    const kst = new KnowSureThingRTIndicator();
    const kstShort = new KnowSureThingRTIndicator([5, 10], [5, 5], [1, 2], 5);
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      const close = bar.close;
      const expected: Record<string, number> = {
        alma20: alma.update(close), almaTuned: almaTuned.update(close), dema20: dema.update(close),
        "env20_2.5": envelopes.update(close), "env20_2.5Upper": envelopes.getUpper(), "env20_2.5Lower": envelopes.getLower(),
        envWide: envWide.update(close), envWideUpper: envWide.getUpper(), envWideLower: envWide.getLower(),
        frama20: frama.update(close), frama21: frama21.update(close), lsma25: lsma.update(close),
        mcg14: mcg.update(close), mom10: mom.update(close), roc12: roc.update(close), cmo14: cmo.update(close),
        dpo20: dpo.update(close), cfo14: cfo.update(close), fisher10: fisher.update(close), trix15: trix.update(close),
        "crsi3_2_100": crsi.update(close), crsiFast: crsiFast.update(close),
        coppock14_11_10: coppock.update(close), coppockShort: coppockShort.update(close),
        afisher10_5_20: afisher.update(close), afisherShort: afisherShort.update(close),
        tsi25_13: tsi.update(close), tsiShort: tsiShort.update(close),
        kst: kst.update(close), kstSignal: kst.getSignal(),
        kstShort: kstShort.update(close), kstShortSignal: kstShort.getSignal(),
      };
      for (const [name, value] of Object.entries(expected)) {
        expect(group.getIndicatorValue(name), name).toBe(value);
      }
    }
  });

  it("reads the price of a ticker feed too, and raises no notice", () => {
    const map = new InstrumentMapTickerSourceRTIndicator(INSTRUMENT);
    const group = new InstrumentGroupRTIndicator(map);
    Pro.on(group)
      .alma(20).dema(20).envelopes().frama().leastSquaresMovingAverage().mcGinleyDynamic().momentum().roc().cmo()
      .detrendedPriceOscillator().chandeForecastOscillator().connorsRsi().coppockCurve().fisherTransform()
      .adaptiveFisherTransform().knowSureThing().trix().trueStrengthIndex();
    const envelopes = new EnvelopesRTIndicator();
    const kst = new KnowSureThingRTIndicator();
    const mom = new MomentumRTIndicator();
    for (const bar of klines(inputsOf("clean")).slice(0, 120)) {
      map.updateFrom(tickerOf(bar.close, bar.timestamp));
      envelopes.update(bar.close);
      kst.update(bar.close);
      mom.update(bar.close);
    }
    expect(group.getNotices()).toEqual([]);
    expect(group.getIndicatorValue("env20_2.5Upper")).toBe(envelopes.getUpper());
    expect(group.getIndicatorValue("kstSignal")).toBe(kst.getSignal());
    expect(group.getIndicatorValue("mom10")).toBe(mom.getValue());
    expect(group.getIndicatorValue("mom10")).not.toBe(0);
  });
});
