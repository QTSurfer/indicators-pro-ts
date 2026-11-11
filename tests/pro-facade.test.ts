import { describe, it, expect } from "vitest";
import type { Kline } from "@qtsurfer/core";
import {
  DisplayHint,
  InstrumentGroupRTIndicator,
  InstrumentMapKlineSourceRTIndicator,
  InstrumentMapTickerSourceRTIndicator,
} from "@qtsurfer/indicators";
import {
  AcceleratorOscillatorRTIndicator,
  AdaptiveFisherTransformRTIndicator,
  AdlRTIndicator,
  AdxRTIndicator,
  AlmaRTIndicator,
  AroonRTIndicator,
  AutocorrelationRTIndicator,
  AwesomeOscillatorRTIndicator,
  BalanceOfPowerRTIndicator,
  BullBearPowerRTIndicator,
  CalmarRatioRTIndicator,
  ChaikinOscillatorRTIndicator,
  ChandeForecastOscillatorRTIndicator,
  ChandeKrollStopRTIndicator,
  ChandelierExitRTIndicator,
  ChoppinessIndexRTIndicator,
  CmoRTIndicator,
  ConnorsRsiRTIndicator,
  CoppockCurveRTIndicator,
  DemaRTIndicator,
  DetrendedPriceOscillatorRTIndicator,
  DonchianChannelRTIndicator,
  EaseOfMovementRTIndicator,
  EfficiencyRatioRTIndicator,
  ElderForceIndexRTIndicator,
  EnvelopesRTIndicator,
  EwmaVolatilityRTIndicator,
  FisherTransformRTIndicator,
  FramaRTIndicator,
  HurstExponentRTIndicator,
  IchimokuRTIndicator,
  KeltnerChannelRTIndicator,
  KlingerOscillatorRTIndicator,
  KnowSureThingRTIndicator,
  KurtosisRTIndicator,
  LeastSquaresMovingAverageRTIndicator,
  LinearRegressionSlopeRTIndicator,
  MassIndexRTIndicator,
  MaxDrawdownRTIndicator,
  McGinleyDynamicRTIndicator,
  MomentumRTIndicator,
  NatrRTIndicator,
  NegativeVolumeIndexRTIndicator,
  OmegaRatioRTIndicator,
  ParabolicSarRTIndicator,
  Pro,
  PvtRTIndicator,
  RealizedVolatilityRTIndicator,
  RelativeVigorIndexRTIndicator,
  RelativeVolatilityIndexRTIndicator,
  RocRTIndicator,
  RollingPercentileRTIndicator,
  SharpeRatioRTIndicator,
  SimpleLinearRegressionRTIndicator,
  SkewnessRTIndicator,
  SortinoRatioRTIndicator,
  StandardDeviationRTIndicator,
  StochasticOscillatorRTIndicator,
  TailRatioRTIndicator,
  TrixRTIndicator,
  TrueStrengthIndexRTIndicator,
  UlcerIndexRTIndicator,
  UltimateOscillatorRTIndicator,
  ValueAtRiskRTIndicator,
  VarianceRTIndicator,
  VortexRTIndicator,
  WilliamsRRTIndicator,
  YangZhangVolatilityRTIndicator,
  ZScoreRTIndicator,
} from "../src";
import { LOG_TOLERANCE, expectSeries, relativeError } from "./compare";
import { inputsOf, klines, reference } from "./fixtures";

const INSTRUMENT = "BTC/USDT";

function klineGroup(): { map: InstrumentMapKlineSourceRTIndicator; group: InstrumentGroupRTIndicator } {
  const map = new InstrumentMapKlineSourceRTIndicator(INSTRUMENT);
  return { map, group: new InstrumentGroupRTIndicator(map) };
}

const tickerOf = (last: number, timestamp: number, high: number | null = null, low: number | null = null) => ({
  instrument: INSTRUMENT, open: null, high, low, last, bid: null, bidSize: null,
  ask: null, askSize: null, volume: high === null ? null : 1, quoteVolume: null, vwap: null, percentageChange: null, timestamp,
});

// the metadata without the display hint, which is tested on its own (a percentage is the `dsp` entry)
const meta = (group: InstrumentGroupRTIndicator, name: string) =>
  Object.fromEntries([...group.getExisting(name).getMeta!().asMap()].filter(([key]) => key !== "dsp"));

const registeredNames = (group: InstrumentGroupRTIndicator): string[] => {
  const names: string[] = [];
  group.indicators.forEachPublicable((name) => names.push(name));
  return names.sort();
};

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

describe("the trend and volatility factories, as the Java engine's Pro gives them", () => {
  // the id each of the ten bar readers registers under with its defaults (natr has none: it is given 14 periods)
  const BAR_READER_IDS = [
    "aroon25", "cks10_1_9_9", "chand22_3", "donch20", "psar0.02_0.2", "vortex14", "chop14", "kc20_10_1.5", "mass25_9", "natr14",
  ];

  function allWithDefaults(): InstrumentGroupRTIndicator {
    const { group } = klineGroup();
    Pro.on(group)
      .aroon().chandeKrollStop().chandelierExit().donchianChannel().efficiencyRatio().parabolicSar().vortex()
      .choppinessIndex().keltnerChannel().massIndex().natr(14).relativeVolatilityIndex();
    return group;
  }

  it("default ids, and the outputs beside the indicator, and no other output", () => {
    const group = allWithDefaults();
    expect(registeredNames(group)).toEqual(
      [
        "aroon25", "aroon25Up", "aroon25Down", "cks10_1_9_9", "cks10_1_9_9StopShort", "chand22_3", "chand22_3ShortExit",
        "donch20", "donch20Upper", "donch20Lower", "er10", "psar0.02_0.2", "vortex14", "vortex14ViPlus", "vortex14ViMinus",
        "chop14", "kc20_10_1.5", "kc20_10_1.5Upper", "kc20_10_1.5Lower", "mass25_9", "natr14", "rvi10_14",
      ].sort(),
    );
    expect(group.getExisting("aroon25")).toBeInstanceOf(AroonRTIndicator);
    expect(group.getExisting("cks10_1_9_9")).toBeInstanceOf(ChandeKrollStopRTIndicator);
    expect(group.getExisting("chand22_3")).toBeInstanceOf(ChandelierExitRTIndicator);
    expect(group.getExisting("donch20")).toBeInstanceOf(DonchianChannelRTIndicator);
    expect(group.getExisting("er10")).toBeInstanceOf(EfficiencyRatioRTIndicator);
    expect(group.getExisting("psar0.02_0.2")).toBeInstanceOf(ParabolicSarRTIndicator);
    expect(group.getExisting("vortex14")).toBeInstanceOf(VortexRTIndicator);
    expect(group.getExisting("chop14")).toBeInstanceOf(ChoppinessIndexRTIndicator);
    expect(group.getExisting("kc20_10_1.5")).toBeInstanceOf(KeltnerChannelRTIndicator);
    expect(group.getExisting("mass25_9")).toBeInstanceOf(MassIndexRTIndicator);
    expect(group.getExisting("natr14")).toBeInstanceOf(NatrRTIndicator);
    expect(group.getExisting("rvi10_14")).toBeInstanceOf(RelativeVolatilityIndexRTIndicator);
  });

  it("the suffix constants, and the output each one registers", () => {
    expect([Pro.SUFFIX_UP, Pro.SUFFIX_DOWN, Pro.SUFFIX_STOP_SHORT, Pro.SUFFIX_SHORT_EXIT, Pro.SUFFIX_VI_PLUS, Pro.SUFFIX_VI_MINUS])
      .toEqual(["Up", "Down", "StopShort", "ShortExit", "ViPlus", "ViMinus"]);
    const group = allWithDefaults();
    for (const [name, output] of [
      ["aroon25Up", "up"], ["aroon25Down", "down"], ["cks10_1_9_9StopShort", "stopshort"], ["chand22_3ShortExit", "shortexit"],
      ["donch20Upper", "upper"], ["donch20Lower", "lower"], ["vortex14ViPlus", "viplus"], ["vortex14ViMinus", "viminus"],
      ["kc20_10_1.5Upper", "upper"], ["kc20_10_1.5Lower", "lower"],
    ] as const) {
      expect(group.getExisting(name).getMeta!().get("output"), name).toBe(output);
    }
  });

  it("the display hints: a percentage where Java says so, the default everywhere else", () => {
    const group = allWithDefaults();
    const percent = ["aroon25", "aroon25Up", "aroon25Down", "chop14", "natr14", "rvi10_14"];
    for (const name of registeredNames(group)) {
      const hint = group.getExisting(name).getDisplayHint!();
      expect(hint, name).toBe(percent.includes(name) ? DisplayHint.PERCENT : DisplayHint.ABSOLUTE);
    }
  });

  it("the four shapes of a factory with one period: the default, the period, a name, a name and a period", () => {
    const { group } = klineGroup();
    const factories = [
      ["aroon", "aroon", 25], ["donchianChannel", "donch", 20], ["efficiencyRatio", "er", 10], ["vortex", "vortex", 14],
      ["choppinessIndex", "chop", 14],
    ] as const;
    const pro = Pro.on(group) as unknown as Record<string, (...args: (string | number)[]) => unknown>;
    for (const [method, prefix, periods] of factories) {
      pro[method]!();
      pro[method]!(7);
      pro[method]!(`${method}Named`);
      pro[method]!(`${method}Both`, 9);
      const expected: [string, number][] = [[`${prefix}${periods}`, periods], [`${prefix}7`, 7], [`${method}Named`, periods], [`${method}Both`, 9]];
      for (const [name, value] of expected) {
        expect(meta(group, name), name).toEqual({ periods: String(value) });
      }
    }
    // the outputs follow the name they were registered under
    for (const name of ["aroonNamedUp", "aroonBothDown", "donchianChannelNamedUpper", "donch7Lower", "vortex7ViPlus", "vortexBothViMinus"]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
    expect(group.get("er7Upper")).toBeUndefined();
  });

  it("the multi-parameter ids write a decimal as the Java engine does, and a whole value without its decimal part", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .chandeKrollStop(5, 2.5, 4, 3).chandeKrollStop(10, 2, 9, 9)
      .chandelierExit(14, 2.5).chandelierExit(10, 2)
      .parabolicSar(0.05, 0.5).parabolicSar(1, 2).parabolicSar(0.0001, 0.2)
      .keltnerChannel(10, 5, 2.5).keltnerChannel(10, 5, 2)
      .massIndex(10, 4).relativeVolatilityIndex(5, 7);
    for (const name of [
      "cks5_2.5_4_3", "cks5_2.5_4_3StopShort", "cks10_2_9_9", "chand14_2.5", "chand14_2.5ShortExit", "chand10_2",
      "psar0.05_0.5", "psar1_2", "psar1.0E-4_0.2", "kc10_5_2.5", "kc10_5_2.5Upper", "kc10_5_2", "kc10_5_2Lower",
      "mass10_4", "rvi5_7",
    ]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
  });

  it("names, parameters and metadata of the multi-parameter factories, and the class defaults on the short forms", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .chandeKrollStop(5, 2.5, 4, 3).chandeKrollStop("s", 7, 1.5, 6, 5).chandeKrollStop("s0")
      .chandelierExit(14, 2.5).chandelierExit("x", 10, 2).chandelierExit("x0")
      .parabolicSar(0.05, 0.5).parabolicSar("p", 0.03, 0.3).parabolicSar("p0")
      .keltnerChannel(10, 5, 2.5).keltnerChannel("k", 15, 7, 1).keltnerChannel("k0")
      .massIndex(10, 4).massIndex("m", 12, 5).massIndex("m0")
      .relativeVolatilityIndex(5, 7).relativeVolatilityIndex("r", 8, 10).relativeVolatilityIndex("r0");
    expect(meta(group, "cks5_2.5_4_3")).toEqual({ atrPeriod: "5", multiplier: "2.5", stopPeriod: "4", finalPeriod: "3" });
    expect(meta(group, "s")).toEqual({ atrPeriod: "7", multiplier: "1.5", stopPeriod: "6", finalPeriod: "5" });
    expect(meta(group, "s0")).toEqual({ atrPeriod: "10", multiplier: "1", stopPeriod: "9", finalPeriod: "9" });
    expect(meta(group, "chand14_2.5")).toEqual({ periods: "14", multiplier: "2.5" });
    expect(meta(group, "x")).toEqual({ periods: "10", multiplier: "2" });
    expect(meta(group, "x0")).toEqual({ periods: "22", multiplier: "3" });
    expect(meta(group, "psar0.05_0.5")).toEqual({ afStep: "0.05", afMax: "0.5" });
    expect(meta(group, "p")).toEqual({ afStep: "0.03", afMax: "0.3" });
    expect(meta(group, "p0")).toEqual({ afStep: "0.02", afMax: "0.2" });
    expect(meta(group, "kc10_5_2.5")).toEqual({ emaPeriod: "10", atrPeriod: "5", multiplier: "2.5" });
    expect(meta(group, "k")).toEqual({ emaPeriod: "15", atrPeriod: "7", multiplier: "1" });
    expect(meta(group, "k0")).toEqual({ emaPeriod: "20", atrPeriod: "10", multiplier: "1.5" });
    expect(meta(group, "mass10_4")).toEqual({ sumPeriod: "10", emaPeriod: "4" });
    expect(meta(group, "m")).toEqual({ sumPeriod: "12", emaPeriod: "5" });
    expect(meta(group, "m0")).toEqual({ sumPeriod: "25", emaPeriod: "9" });
    expect(meta(group, "rvi5_7")).toEqual({ stdPeriod: "5", rsiPeriod: "7" });
    expect(meta(group, "r")).toEqual({ stdPeriod: "8", rsiPeriod: "10" });
    expect(meta(group, "r0")).toEqual({ stdPeriod: "10", rsiPeriod: "14" });
    // the outputs of a named form follow its name
    for (const name of ["sStopShort", "s0StopShort", "xShortExit", "kUpper", "k0Lower"]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
  });

  it("NATR has no form without a period: a period, or a name and a period", () => {
    const { group } = klineGroup();
    // the type checker refuses a call without a period (the closure never runs)
    // @ts-expect-error natr() has no no-argument form
    const withoutPeriod = () => Pro.on(group).natr();
    expect(withoutPeriod).toBeTypeOf("function");
    Pro.on(group).natr(14).natr(3).natr("n", 7);
    expect(meta(group, "natr14")).toEqual({ periods: "14" });
    expect(meta(group, "natr3")).toEqual({ periods: "3" });
    expect(meta(group, "n")).toEqual({ periods: "7" });
    expect(registeredNames(group)).toEqual(["n", "natr14", "natr3"]);
  });

  it("the constructor limits come through the factory, with the Java messages, and register nothing", () => {
    const { group } = klineGroup();
    const pro = Pro.on(group);
    const limits: [() => unknown, string][] = [
      [() => pro.aroon(0), "Periods must be >= 1, got: 0"],
      [() => pro.aroon("a", 0), "Periods must be >= 1, got: 0"],
      [() => pro.chandeKrollStop(0, 1, 9, 9), "AtrPeriod must be >= 1, got: 0"],
      [() => pro.chandeKrollStop(10, -1, 9, 9), "Multiplier must be finite and >= 0, got: -1.0"],
      [() => pro.chandeKrollStop(10, 1, 0, 9), "StopPeriod must be >= 1, got: 0"],
      [() => pro.chandeKrollStop(10, 1, 9, 0), "FinalPeriod must be >= 1, got: 0"],
      [() => pro.chandeKrollStop("s", 10, 1, 9, 0), "FinalPeriod must be >= 1, got: 0"],
      [() => pro.chandelierExit(0, 3), "Periods must be >= 1, got: 0"],
      [() => pro.chandelierExit(22, -1), "Multiplier must be finite and >= 0, got: -1.0"],
      [() => pro.donchianChannel(0), "Periods must be >= 1, got: 0"],
      [() => pro.efficiencyRatio(0), "Periods must be >= 1, got: 0"],
      [() => pro.parabolicSar(0, 0.2), "AfStep must be finite and > 0, got: 0.0"],
      [() => pro.parabolicSar(0.02, 0), "AfMax must be finite and > 0, got: 0.0"],
      [() => pro.parabolicSar(-0.02, 0.2), "AfStep must be finite and > 0, got: -0.02"],
      [() => pro.vortex(0), "Periods must be >= 1, got: 0"],
      [() => pro.choppinessIndex(0), "Periods must be >= 1, got: 0"],
      [() => pro.keltnerChannel(0, 10, 1.5), "EmaPeriod must be >= 1, got: 0"],
      [() => pro.keltnerChannel(20, 0, 1.5), "AtrPeriod must be >= 1, got: 0"],
      [() => pro.keltnerChannel(20, 10, -1), "Multiplier must be finite and >= 0, got: -1.0"],
      [() => pro.massIndex(0, 9), "SumPeriod must be >= 1, got: 0"],
      [() => pro.massIndex(25, 0), "EmaPeriod must be >= 1, got: 0"],
      [() => pro.natr(0), "Periods must be >= 1, got: 0"],
      [() => pro.natr("n", 0), "Periods must be >= 1, got: 0"],
      [() => pro.relativeVolatilityIndex(1, 14), "StdPeriod must be >= 2, got: 1"],
      [() => pro.relativeVolatilityIndex(10, 0), "RsiPeriod must be >= 1, got: 0"],
    ];
    for (const [call, message] of limits) {
      expect(call).toThrow(new RangeError(message));
    }
    // a factory that throws registers nothing
    expect(registeredNames(group)).toEqual([]);
  });

  it("a kline group gives, bar after bar, what each class gives on the same bars, options and outputs included", () => {
    const { map, group } = klineGroup();
    Pro.on(group)
      .aroon().aroon("aroon5", 5).chandeKrollStop().chandeKrollStop("cksTuned", 5, 2.5, 4, 3)
      .chandelierExit().chandelierExit(5, 1.5).donchianChannel().donchianChannel(5).efficiencyRatio()
      .parabolicSar().parabolicSar(0.05, 0.5).vortex().vortex(3).choppinessIndex().choppinessIndex(5)
      .keltnerChannel().keltnerChannel("kcTuned", 5, 3, 2).massIndex().massIndex(5, 3).natr(14).natr(3)
      .relativeVolatilityIndex().relativeVolatilityIndex(5, 7);
    const aroon = new AroonRTIndicator();
    const aroon5 = new AroonRTIndicator(5);
    const cks = new ChandeKrollStopRTIndicator();
    const cksTuned = new ChandeKrollStopRTIndicator(5, 2.5, 4, 3);
    const chandelier = new ChandelierExitRTIndicator();
    const chandelier5 = new ChandelierExitRTIndicator(5, 1.5);
    const donchian = new DonchianChannelRTIndicator();
    const donchian5 = new DonchianChannelRTIndicator(5);
    const er = new EfficiencyRatioRTIndicator();
    const psar = new ParabolicSarRTIndicator();
    const psarFast = new ParabolicSarRTIndicator(0.05, 0.5);
    const vortex = new VortexRTIndicator();
    const vortex3 = new VortexRTIndicator(3);
    const chop = new ChoppinessIndexRTIndicator();
    const chop5 = new ChoppinessIndexRTIndicator(5);
    const keltner = new KeltnerChannelRTIndicator();
    const kcTuned = new KeltnerChannelRTIndicator(5, 3, 2);
    const mass = new MassIndexRTIndicator();
    const mass5 = new MassIndexRTIndicator(5, 3);
    const natr14 = new NatrRTIndicator(14);
    const natr3 = new NatrRTIndicator(3);
    const rvi = new RelativeVolatilityIndexRTIndicator();
    const rviFast = new RelativeVolatilityIndexRTIndicator(5, 7);
    // the bar readers take the whole bar, the efficiency ratio and the relative volatility index the close
    const fed = <T extends { updateFrom(bar: Kline): void; getValue(): number }>(indicator: T, bar: Kline): T => {
      indicator.updateFrom(bar);
      return indicator;
    };
    let finite = 0;
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      const expected: Record<string, number> = {
        aroon25: fed(aroon, bar).getValue(), aroon25Up: aroon.getAroonUp(), aroon25Down: aroon.getAroonDown(),
        aroon5: fed(aroon5, bar).getValue(), aroon5Up: aroon5.getAroonUp(), aroon5Down: aroon5.getAroonDown(),
        cks10_1_9_9: fed(cks, bar).getValue(), cks10_1_9_9StopShort: cks.getStopShort(),
        cksTuned: fed(cksTuned, bar).getValue(), cksTunedStopShort: cksTuned.getStopShort(),
        chand22_3: fed(chandelier, bar).getValue(), chand22_3ShortExit: chandelier.getShortExit(),
        "chand5_1.5": fed(chandelier5, bar).getValue(), "chand5_1.5ShortExit": chandelier5.getShortExit(),
        donch20: fed(donchian, bar).getValue(), donch20Upper: donchian.getUpper(), donch20Lower: donchian.getLower(),
        donch5: fed(donchian5, bar).getValue(), donch5Upper: donchian5.getUpper(), donch5Lower: donchian5.getLower(),
        er10: er.update(bar.close),
        "psar0.02_0.2": fed(psar, bar).getValue(), "psar0.05_0.5": fed(psarFast, bar).getValue(),
        vortex14: fed(vortex, bar).getValue(), vortex14ViPlus: vortex.getVIPlus(), vortex14ViMinus: vortex.getVIMinus(),
        vortex3: fed(vortex3, bar).getValue(), vortex3ViPlus: vortex3.getVIPlus(), vortex3ViMinus: vortex3.getVIMinus(),
        chop14: fed(chop, bar).getValue(), chop5: fed(chop5, bar).getValue(),
        "kc20_10_1.5": fed(keltner, bar).getValue(), "kc20_10_1.5Upper": keltner.getUpper(), "kc20_10_1.5Lower": keltner.getLower(),
        kcTuned: fed(kcTuned, bar).getValue(), kcTunedUpper: kcTuned.getUpper(), kcTunedLower: kcTuned.getLower(),
        mass25_9: fed(mass, bar).getValue(), mass5_3: fed(mass5, bar).getValue(),
        natr14: fed(natr14, bar).getValue(), natr3: fed(natr3, bar).getValue(),
        rvi10_14: rvi.update(bar.close), rvi5_7: rviFast.update(bar.close),
      };
      for (const [name, value] of Object.entries(expected)) {
        expect(group.getIndicatorValue(name), name).toBe(value);
        if (Number.isFinite(value) && value !== 0) finite++;
      }
    }
    // the comparison is not between zeros
    expect(finite).toBeGreaterThan(30 * 400);
  });

  it("on a ticker feed each of the ten bar readers raises one notice, for the indicator and not for its outputs", () => {
    const map = new InstrumentMapTickerSourceRTIndicator(INSTRUMENT);
    const group = new InstrumentGroupRTIndicator(map);
    Pro.on(group)
      .aroon().chandeKrollStop().chandelierExit().donchianChannel().parabolicSar().vortex().choppinessIndex()
      .keltnerChannel().massIndex().natr(14);
    for (let i = 1; i <= 3; i++) {
      map.updateFrom(tickerOf(1.5 + i, i, 2 + i, 1));
    }
    expect(group.getNotices().map((notice) => notice.indicatorName).sort()).toEqual([...BAR_READER_IDS].sort());
    expect(group.getNotices().every((notice) => notice.instrument === INSTRUMENT)).toBe(true);
  });

  it("on a ticker feed the efficiency ratio and the relative volatility index read the price and raise no notice", () => {
    const map = new InstrumentMapTickerSourceRTIndicator(INSTRUMENT);
    const group = new InstrumentGroupRTIndicator(map);
    Pro.on(group).efficiencyRatio().relativeVolatilityIndex();
    const er = new EfficiencyRatioRTIndicator();
    const rvi = new RelativeVolatilityIndexRTIndicator();
    for (const bar of klines(inputsOf("clean")).slice(0, 120)) {
      map.updateFrom(tickerOf(bar.close, bar.timestamp, bar.high, bar.low));
      er.update(bar.close);
      rvi.update(bar.close);
    }
    expect(group.getNotices()).toEqual([]);
    expect(group.getIndicatorValue("er10")).toBe(er.getValue());
    expect(group.getIndicatorValue("rvi10_14")).toBe(rvi.getValue());
    expect(group.getIndicatorValue("er10")).not.toBe(0);
    expect(group.getIndicatorValue("rvi10_14")).not.toBe(0);
  });
});

describe("the momentum and volume factories that read whole bars, as the Java engine's Pro gives them", () => {
  // the id each of the fifteen registers under with its defaults, and the class behind it
  const DEFAULTS = [
    ["acc", AcceleratorOscillatorRTIndicator], ["ao5_34", AwesomeOscillatorRTIndicator], ["bop", BalanceOfPowerRTIndicator],
    ["bbp13", BullBearPowerRTIndicator], ["rvgi10", RelativeVigorIndexRTIndicator], ["stoch14_3_3", StochasticOscillatorRTIndicator],
    ["uo", UltimateOscillatorRTIndicator], ["willr14", WilliamsRRTIndicator], ["adl", AdlRTIndicator],
    ["chaikin3_10", ChaikinOscillatorRTIndicator], ["eom14", EaseOfMovementRTIndicator], ["efi13", ElderForceIndexRTIndicator],
    ["klinger", KlingerOscillatorRTIndicator], ["nvi", NegativeVolumeIndexRTIndicator], ["pvt", PvtRTIndicator],
  ] as const;

  function allWithDefaults(group: InstrumentGroupRTIndicator): InstrumentGroupRTIndicator {
    Pro.on(group)
      .acceleratorOscillator().awesomeOscillator().balanceOfPower().bullBearPower().relativeVigorIndex()
      .stochasticOscillator().ultimateOscillator().williamsR().adl().chaikinOscillator().easeOfMovement()
      .elderForceIndex().klingerOscillator().negativeVolumeIndex().pvt();
    return group;
  }

  it("default ids, and the outputs beside the indicator, and no other output", () => {
    const { group } = klineGroup();
    allWithDefaults(group);
    expect(registeredNames(group)).toEqual(
      [
        ...DEFAULTS.map(([id]) => id), "bbp13Bull", "bbp13Bear", "stoch14_3_3D", "klingerSignal",
      ].sort(),
    );
    for (const [id, type] of DEFAULTS) {
      expect(group.getExisting(id), id).toBeInstanceOf(type);
    }
  });

  it("the suffix constants, and the output each one registers", () => {
    expect([Pro.SUFFIX_BULL, Pro.SUFFIX_BEAR, Pro.SUFFIX_D]).toEqual(["Bull", "Bear", "D"]);
    const { group } = klineGroup();
    allWithDefaults(group);
    for (const [name, output] of [
      ["bbp13Bull", "bull"], ["bbp13Bear", "bear"], ["stoch14_3_3D", "d"], ["klingerSignal", "signal"],
    ] as const) {
      expect(group.getExisting(name).getMeta!().get("output"), name).toBe(output);
    }
  });

  it("the display hints: a percentage or a volume where Java says so, the default everywhere else", () => {
    const { group } = klineGroup();
    allWithDefaults(group);
    const percent = ["stoch14_3_3", "stoch14_3_3D", "uo", "willr14"];
    const volume = ["adl", "chaikin3_10", "efi13", "klinger", "klingerSignal", "pvt"];
    for (const name of registeredNames(group)) {
      const expected = percent.includes(name) ? DisplayHint.PERCENT : volume.includes(name) ? DisplayHint.VOLUME : DisplayHint.ABSOLUTE;
      expect(group.getExisting(name).getDisplayHint!(), name).toBe(expected);
    }
  });

  it("the four shapes of a factory with one period: the default, the period, a name and a name and a period", () => {
    const { group } = klineGroup();
    // the factories whose option is `periods`, and those whose option is `period`
    const factories = [
      ["williamsR", "willr", 14, "periods"], ["easeOfMovement", "eom", 14, "periods"], ["elderForceIndex", "efi", 13, "periods"],
      ["bullBearPower", "bbp", 13, "period"], ["relativeVigorIndex", "rvgi", 10, "period"],
    ] as const;
    const pro = Pro.on(group) as unknown as Record<string, (...args: (string | number)[]) => unknown>;
    for (const [method, prefix, periods, option] of factories) {
      pro[method]!();
      pro[method]!(7);
      pro[method]!(`${method}Named`);
      pro[method]!(`${method}Both`, 9);
      const expected: [string, number][] = [[`${prefix}${periods}`, periods], [`${prefix}7`, 7], [`${method}Named`, periods], [`${method}Both`, 9]];
      for (const [name, value] of expected) {
        expect(meta(group, name), name).toEqual({ [option]: String(value) });
      }
    }
    // the outputs follow the name they were registered under
    for (const name of ["bullBearPowerNamedBull", "bullBearPowerBothBear", "bbp7Bull", "bbp7Bear"]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
  });

  it("the multi-parameter factories: ids, names and metadata, and the class defaults on the short forms", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .awesomeOscillator(8, 21).awesomeOscillator("a", 3, 13).awesomeOscillator("a0")
      .chaikinOscillator(5, 20).chaikinOscillator("c", 2, 8).chaikinOscillator("c0")
      .stochasticOscillator(5, 3, 2).stochasticOscillator("s", 9, 4, 4).stochasticOscillator("s0");
    expect(meta(group, "ao8_21")).toEqual({ fastPeriod: "8", slowPeriod: "21" });
    expect(meta(group, "a")).toEqual({ fastPeriod: "3", slowPeriod: "13" });
    expect(meta(group, "a0")).toEqual({ fastPeriod: "5", slowPeriod: "34" });
    expect(meta(group, "chaikin5_20")).toEqual({ fastPeriod: "5", slowPeriod: "20" });
    expect(meta(group, "c")).toEqual({ fastPeriod: "2", slowPeriod: "8" });
    expect(meta(group, "c0")).toEqual({ fastPeriod: "3", slowPeriod: "10" });
    expect(meta(group, "stoch5_3_2")).toEqual({ kPeriod: "5", kSmooth: "3", dSmooth: "2" });
    expect(meta(group, "s")).toEqual({ kPeriod: "9", kSmooth: "4", dSmooth: "4" });
    expect(meta(group, "s0")).toEqual({ kPeriod: "14", kSmooth: "3", dSmooth: "3" });
    // the outputs of a named form follow its name
    for (const name of ["stoch5_3_2D", "sD", "s0D"]) {
      expect(group.getExisting(name), name).toBeDefined();
    }
    expect(group.get("aD")).toBeUndefined();
  });

  it("a fast period above the slow one is accepted by the Awesome and Chaikin oscillators", () => {
    const { group } = klineGroup();
    Pro.on(group).awesomeOscillator(8, 3).chaikinOscillator(10, 3);
    expect(meta(group, "ao8_3")).toEqual({ fastPeriod: "8", slowPeriod: "3" });
    expect(meta(group, "chaikin10_3")).toEqual({ fastPeriod: "10", slowPeriod: "3" });
  });

  it("the seven classes without parameters take only a name, and record no metadata", () => {
    const { group } = klineGroup();
    const pro = Pro.on(group);
    pro.acceleratorOscillator().balanceOfPower().ultimateOscillator().adl().klingerOscillator().negativeVolumeIndex().pvt();
    pro.acceleratorOscillator("a").balanceOfPower("b").ultimateOscillator("u").adl("d").klingerOscillator("k").negativeVolumeIndex("n").pvt("p");
    for (const name of ["acc", "bop", "uo", "adl", "klinger", "nvi", "pvt", "a", "b", "u", "d", "k", "n", "p"]) {
      expect(meta(group, name), name).toEqual({});
    }
    expect(group.getExisting("a")).toBeInstanceOf(AcceleratorOscillatorRTIndicator);
    expect(group.getExisting("kSignal")).toBeDefined();
    expect(group.getExisting("kSignal").getMeta!().get("output")).toBe("signal");
    // the type checker refuses a parameter (the closure never runs)
    // @ts-expect-error adl() has no parameter
    const withParameter = () => Pro.on(group).adl(5);
    expect(withParameter).toBeTypeOf("function");
  });

  it("the constructor limits come through the factory, with the Java messages, and register nothing", () => {
    const { group } = klineGroup();
    const pro = Pro.on(group);
    const limits: [() => unknown, string][] = [
      [() => pro.awesomeOscillator(0, 34), "FastPeriod must be >= 1, got: 0"],
      [() => pro.awesomeOscillator(5, 0), "SlowPeriod must be >= 1, got: 0"],
      [() => pro.awesomeOscillator("a", 0, 34), "FastPeriod must be >= 1, got: 0"],
      [() => pro.bullBearPower(0), "Period must be >= 1, got: 0"],
      [() => pro.bullBearPower("b", 0), "Period must be >= 1, got: 0"],
      [() => pro.relativeVigorIndex(0), "Period must be >= 1, got: 0"],
      [() => pro.stochasticOscillator(0, 3, 3), "KPeriod must be >= 1, got: 0"],
      [() => pro.stochasticOscillator(14, 0, 3), "KSmooth must be >= 1, got: 0"],
      [() => pro.stochasticOscillator(14, 3, 0), "DSmooth must be >= 1, got: 0"],
      [() => pro.stochasticOscillator("s", 14, 3, 0), "DSmooth must be >= 1, got: 0"],
      [() => pro.williamsR(0), "Periods must be >= 1, got: 0"],
      [() => pro.williamsR("w", 0), "Periods must be >= 1, got: 0"],
      [() => pro.chaikinOscillator(0, 10), "FastPeriod must be >= 1, got: 0"],
      [() => pro.chaikinOscillator(3, 0), "SlowPeriod must be >= 1, got: 0"],
      [() => pro.chaikinOscillator("c", 3, 0), "SlowPeriod must be >= 1, got: 0"],
      [() => pro.easeOfMovement(0), "Periods must be >= 1, got: 0"],
      [() => pro.elderForceIndex(0), "Periods must be >= 1, got: 0"],
      [() => pro.elderForceIndex(-3), "Periods must be >= 1, got: -3"],
    ];
    for (const [call, message] of limits) {
      expect(call).toThrow(new RangeError(message));
    }
    // a factory that throws registers nothing
    expect(registeredNames(group)).toEqual([]);
  });

  it("a kline group gives, bar after bar, what each class gives on the same bars, options and outputs included", () => {
    const { map, group } = klineGroup();
    Pro.on(group)
      .acceleratorOscillator().awesomeOscillator().awesomeOscillator("aoFast", 3, 13).awesomeOscillator("aoInverted", 8, 3)
      .balanceOfPower().bullBearPower().bullBearPower(5).relativeVigorIndex().relativeVigorIndex(4)
      .stochasticOscillator().stochasticOscillator("stochTuned", 5, 3, 2).ultimateOscillator().williamsR().williamsR(5)
      .adl().chaikinOscillator().chaikinOscillator("chaikinTuned", 2, 8).chaikinOscillator("chaikinInverted", 10, 3)
      .easeOfMovement().easeOfMovement(5).elderForceIndex().elderForceIndex(5).klingerOscillator().negativeVolumeIndex().pvt();
    const acc = new AcceleratorOscillatorRTIndicator();
    const ao = new AwesomeOscillatorRTIndicator();
    const aoFast = new AwesomeOscillatorRTIndicator(3, 13);
    const aoInverted = new AwesomeOscillatorRTIndicator(8, 3);
    const bop = new BalanceOfPowerRTIndicator();
    const bbp = new BullBearPowerRTIndicator();
    const bbp5 = new BullBearPowerRTIndicator(5);
    const rvgi = new RelativeVigorIndexRTIndicator();
    const rvgi4 = new RelativeVigorIndexRTIndicator(4);
    const stoch = new StochasticOscillatorRTIndicator();
    const stochTuned = new StochasticOscillatorRTIndicator(5, 3, 2);
    const uo = new UltimateOscillatorRTIndicator();
    const willr = new WilliamsRRTIndicator();
    const willr5 = new WilliamsRRTIndicator(5);
    const adl = new AdlRTIndicator();
    const chaikin = new ChaikinOscillatorRTIndicator();
    const chaikinTuned = new ChaikinOscillatorRTIndicator(2, 8);
    const chaikinInverted = new ChaikinOscillatorRTIndicator(10, 3);
    const eom = new EaseOfMovementRTIndicator();
    const eom5 = new EaseOfMovementRTIndicator(5);
    const efi = new ElderForceIndexRTIndicator();
    const efi5 = new ElderForceIndexRTIndicator(5);
    const klinger = new KlingerOscillatorRTIndicator();
    const nvi = new NegativeVolumeIndexRTIndicator();
    const pvt = new PvtRTIndicator();
    const fed = <T extends { updateFrom(bar: Kline): void; getValue(): number }>(indicator: T, bar: Kline): T => {
      indicator.updateFrom(bar);
      return indicator;
    };
    let finite = 0;
    let bars = 0;
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      bars++;
      const expected: Record<string, number> = {
        acc: fed(acc, bar).getValue(),
        ao5_34: fed(ao, bar).getValue(), aoFast: fed(aoFast, bar).getValue(), aoInverted: fed(aoInverted, bar).getValue(),
        bop: fed(bop, bar).getValue(),
        bbp13: fed(bbp, bar).getValue(), bbp13Bull: bbp.getBullPower(), bbp13Bear: bbp.getBearPower(),
        bbp5: fed(bbp5, bar).getValue(), bbp5Bull: bbp5.getBullPower(), bbp5Bear: bbp5.getBearPower(),
        rvgi10: fed(rvgi, bar).getValue(), rvgi4: fed(rvgi4, bar).getValue(),
        stoch14_3_3: fed(stoch, bar).getValue(), stoch14_3_3D: stoch.getPercentD(),
        stochTuned: fed(stochTuned, bar).getValue(), stochTunedD: stochTuned.getPercentD(),
        uo: fed(uo, bar).getValue(),
        willr14: fed(willr, bar).getValue(), willr5: fed(willr5, bar).getValue(),
        adl: fed(adl, bar).getValue(),
        chaikin3_10: fed(chaikin, bar).getValue(), chaikinTuned: fed(chaikinTuned, bar).getValue(),
        chaikinInverted: fed(chaikinInverted, bar).getValue(),
        eom14: fed(eom, bar).getValue(), eom5: fed(eom5, bar).getValue(),
        efi13: fed(efi, bar).getValue(), efi5: fed(efi5, bar).getValue(),
        klinger: fed(klinger, bar).getValue(), klingerSignal: klinger.getSignal(),
        nvi: fed(nvi, bar).getValue(), pvt: fed(pvt, bar).getValue(),
      };
      for (const [name, value] of Object.entries(expected)) {
        expect(group.getIndicatorValue(name), name).toBe(value);
        if (Number.isFinite(value) && value !== 0) finite++;
      }
      // %K is the value of the stochastic oscillator
      expect(stoch.getPercentK()).toBe(stoch.getValue());
    }
    // the comparison is not between zeros
    expect(finite).toBeGreaterThan(30 * 500);
    expect(bars).toBeGreaterThan(500);
  });

  it("on a ticker feed each of the fifteen raises one notice, for the indicator and not for its outputs", () => {
    const map = new InstrumentMapTickerSourceRTIndicator(INSTRUMENT);
    const group = allWithDefaults(new InstrumentGroupRTIndicator(map));
    for (let i = 1; i <= 3; i++) {
      map.updateFrom({ ...tickerOf(1.5 + i, i, 2 + i, 1), open: 1.2 + i });
    }
    const notices = group.getNotices();
    expect(notices.map((notice) => notice.indicatorName).sort()).toEqual(DEFAULTS.map(([id]) => id).sort());
    expect(notices.every((notice) => notice.instrument === INSTRUMENT)).toBe(true);
  });
});

describe("the exact statistics factories, as the Java engine's Pro gives them", () => {
  const closes = klines(inputsOf("clean")).map((bar) => bar.close);

  it("default ids, with the pro classes behind them and no other output", () => {
    const { group } = klineGroup();
    Pro.on(group).exactStdDev(20).exactVariance(20);
    expect(registeredNames(group)).toEqual(["xstd20", "xvar20"]);
    expect(group.getExisting("xstd20")).toBeInstanceOf(StandardDeviationRTIndicator);
    expect(group.getExisting("xvar20")).toBeInstanceOf(VarianceRTIndicator);
    expect(group.getExisting("xstd20").getDisplayHint!()).toBe(DisplayHint.ABSOLUTE);
    expect(group.getExisting("xvar20").getDisplayHint!()).toBe(DisplayHint.ABSOLUTE);
  });

  it("the three shapes of each: a period, a name and a period, a name with the period and the form", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .exactStdDev(5).exactStdDev("sd", 14).exactStdDev("sdSample", 15, true).exactStdDev("sdPopulation", 16, false)
      .exactVariance(5).exactVariance("v", 14).exactVariance("vSample", 15, true).exactVariance("vPopulation", 16, false);
    expect(registeredNames(group)).toEqual(
      ["sd", "sdPopulation", "sdSample", "v", "vPopulation", "vSample", "xstd5", "xvar5"],
    );
  });

  it("records the periods and the form in the metadata: the short forms are the population form", () => {
    const { group } = klineGroup();
    Pro.on(group)
      .exactStdDev(5).exactStdDev("sd", 14).exactStdDev("sdSample", 15, true).exactStdDev("sdPopulation", 16, false)
      .exactVariance(5).exactVariance("v", 14).exactVariance("vSample", 15, true).exactVariance("vPopulation", 16, false);
    expect(meta(group, "xstd5")).toEqual({ periods: "5", sample: "false" });
    expect(meta(group, "sd")).toEqual({ periods: "14", sample: "false" });
    expect(meta(group, "sdSample")).toEqual({ periods: "15", sample: "true" });
    expect(meta(group, "sdPopulation")).toEqual({ periods: "16", sample: "false" });
    expect(meta(group, "xvar5")).toEqual({ periods: "5", sample: "false" });
    expect(meta(group, "v")).toEqual({ periods: "14", sample: "false" });
    expect(meta(group, "vSample")).toEqual({ periods: "15", sample: "true" });
    expect(meta(group, "vPopulation")).toEqual({ periods: "16", sample: "false" });
  });

  it("the short forms and the form false give the population value, and true gives the sample value", () => {
    const { map, group } = klineGroup();
    Pro.on(group)
      .exactVariance("short", 20).exactVariance("population", 20, false).exactVariance("sample", 20, true)
      .exactStdDev("sdShort", 20).exactStdDev("sdPopulation", 20, false).exactStdDev("sdSample", 20, true);
    const population = new VarianceRTIndicator(20);
    const sample = new VarianceRTIndicator(20).withSampleVariance(true);
    const sdPopulation = new StandardDeviationRTIndicator(20);
    const sdSample = new StandardDeviationRTIndicator(20).withSampleVariance(true);
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      const expected: Record<string, number> = {
        short: population.update(bar.close),
        population: population.getValue(),
        sample: sample.update(bar.close),
        sdShort: sdPopulation.update(bar.close),
        sdPopulation: sdPopulation.getValue(),
        sdSample: sdSample.update(bar.close),
      };
      for (const [name, value] of Object.entries(expected)) {
        expect(group.getIndicatorValue(name), name).toBe(value);
      }
    }
    expect(group.getIndicatorValue("sample")).toBeGreaterThan(group.getIndicatorValue("population"));
    expect(group.getIndicatorValue("sdSample")).toBeGreaterThan(group.getIndicatorValue("sdPopulation"));
  });

  it("a kline group gives, bar after bar, what each class gives on the close", () => {
    const { map, group } = klineGroup();
    Pro.on(group).exactStdDev(20).exactVariance(20);
    const stdDev = new StandardDeviationRTIndicator(20);
    const variance = new VarianceRTIndicator(20);
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      expect(group.getIndicatorValue("xstd20")).toBe(stdDev.update(bar.close));
      expect(group.getIndicatorValue("xvar20")).toBe(variance.update(bar.close));
    }
    expect(stdDev.getValue()).toBeGreaterThan(0);
  });

  it("reads the price of a ticker feed too, and raises no notice, unlike a bar reader", () => {
    const map = new InstrumentMapTickerSourceRTIndicator(INSTRUMENT);
    const group = new InstrumentGroupRTIndicator(map);
    Pro.on(group).exactStdDev(20).exactVariance(20).exactVariance("sample", 20, true);
    const stdDev = new StandardDeviationRTIndicator(20);
    const variance = new VarianceRTIndicator(20);
    const sample = new VarianceRTIndicator(20).withSampleVariance(true);
    closes.slice(0, 60).forEach((close, i) => {
      map.updateFrom(tickerOf(close, i + 1));
      expect(group.getIndicatorValue("xstd20")).toBe(stdDev.update(close));
      expect(group.getIndicatorValue("xvar20")).toBe(variance.update(close));
      expect(group.getIndicatorValue("sample")).toBe(sample.update(close));
    });
    expect(group.getNotices()).toEqual([]);
    expect(group.getIndicatorValue("xvar20")).not.toBe(0);
  });

  it("exactVariance(name, 20, true) equals the free variance(20) once the window is full, and exactStdDev the free stdDev(20)", () => {
    const { map, group } = klineGroup();
    group.variance(20).stdDev(20);
    Pro.on(group).exactVariance("xv", 20, true).exactStdDev("xs", 20, true);
    let warm = 0;
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      if (group.getExisting("variance20").isReady()) {
        warm++;
        expect(group.getIndicatorValue("xv"), `variance at ${warm}`).toBe(group.getIndicatorValue("variance20"));
        expect(group.getIndicatorValue("xs"), `stdDev at ${warm}`).toBe(group.getIndicatorValue("stdDev20"));
      }
    }
    expect(warm).toBeGreaterThan(500);
  });

  it("a window of identical prices has exactly no variance and no deviation, where the free variance can leave a rounding residue", () => {
    const { map, group } = klineGroup();
    group.variance(20);
    Pro.on(group).exactVariance("xv", 20, true).exactVariance(20).exactStdDev("xs", 20, true).exactStdDev(20);
    for (let i = 0; i < 30; i++) {
      map.updateFrom({ ...klines(inputsOf("clean"))[0], open: 0.1, high: 0.1, low: 0.1, close: 0.1, timestamp: i + 1 });
    }
    for (const name of ["xv", "xvar20", "xs", "xstd20"]) {
      expect(group.getIndicatorValue(name), name).toBe(0);
    }
    expect(Math.abs(group.getIndicatorValue("variance20"))).toBeLessThan(1e-12);
  });

  it("exactVariance(20) is the free variance(20) times (periods - 1) / periods, and exactStdDev(20) the free stdDev(20) times its square root", () => {
    const { map, group } = klineGroup();
    group.variance(20).stdDev(20);
    Pro.on(group).exactVariance(20).exactStdDev(20);
    // the scaling rounds once more on the free side, so the two agree to a rounding or two and not to the last bit
    // (about 2.3e-16 apart at the most on this dataset, and equal for most of the values)
    const ROUNDING = 5e-16;
    let warm = 0;
    for (const bar of klines(inputsOf("clean"))) {
      map.updateFrom(bar);
      if (group.getExisting("variance20").isReady()) {
        warm++;
        expect(relativeError(group.getIndicatorValue("xvar20"), (group.getIndicatorValue("variance20") * 19) / 20), `variance at ${warm}`)
          .toBeLessThanOrEqual(ROUNDING);
        expect(relativeError(group.getIndicatorValue("xstd20"), group.getIndicatorValue("stdDev20") * Math.sqrt(19 / 20)), `stdDev at ${warm}`)
          .toBeLessThanOrEqual(ROUNDING);
      }
    }
    expect(warm).toBeGreaterThan(500);
  });

  it("a bad period throws in every shape, and registers nothing", () => {
    const { group } = klineGroup();
    for (const periods of [0, -1]) {
      expect(() => Pro.on(group).exactStdDev(periods)).toThrow();
      expect(() => Pro.on(group).exactStdDev("sd", periods)).toThrow();
      expect(() => Pro.on(group).exactStdDev("sd", periods, true)).toThrow();
      expect(() => Pro.on(group).exactStdDev("sd", periods, false)).toThrow();
      expect(() => Pro.on(group).exactVariance(periods)).toThrow();
      expect(() => Pro.on(group).exactVariance("v", periods)).toThrow();
      expect(() => Pro.on(group).exactVariance("v", periods, true)).toThrow();
      expect(() => Pro.on(group).exactVariance("v", periods, false)).toThrow();
      expect(() => new StandardDeviationRTIndicator(periods)).toThrow();
      expect(() => new VarianceRTIndicator(periods)).toThrow();
    }
    expect(registeredNames(group)).toEqual([]);
  });

  it("the deviation class: periods, mean, the variance behind it, the form, readiness and reset", () => {
    const stdDev = new StandardDeviationRTIndicator(4);
    expect(stdDev.periods).toBe(4);
    expect(stdDev.isReady()).toBe(false);
    for (const price of [1, 2, 3, 4]) stdDev.update(price);
    expect(stdDev.isReady()).toBe(true);
    expect(stdDev.getMean()).toBe(2.5);
    expect(stdDev.getVariance().getValue()).toBe(1.25);
    expect(stdDev.getValue()).toBe(Math.sqrt(1.25));
    // the variance behind the deviation is the live instance, and the form chosen on the deviation is the one it works
    expect(stdDev.getVariance()).toBe(stdDev.getVariance());
    expect(stdDev.withSampleVariance(true)).toBe(stdDev);
    stdDev.update(5);
    expect(stdDev.getVariance().getValue()).toBe((1.25 * 4) / 3);
    expect(stdDev.getValue()).toBe(Math.sqrt((1.25 * 4) / 3));
    stdDev.reset();
    expect(stdDev.isReady()).toBe(false);
    expect(stdDev.getValue()).toBe(0);
    expect(stdDev.getMean()).toBe(0);
    expect(stdDev.getVariance().getValue()).toBe(0);
    // a flat window has no deviation
    for (let i = 0; i < 4; i++) stdDev.update(7);
    expect(stdDev.getValue()).toBe(0);
    expect(stdDev.getMean()).toBe(7);
  });
});
