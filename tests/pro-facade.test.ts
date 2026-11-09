import { describe, it, expect } from "vitest";
import {
  DisplayHint,
  InstrumentGroupRTIndicator,
  InstrumentMapKlineSourceRTIndicator,
  InstrumentMapTickerSourceRTIndicator,
} from "@qtsurfer/indicators";
import {
  AdxRTIndicator,
  AutocorrelationRTIndicator,
  CalmarRatioRTIndicator,
  EwmaVolatilityRTIndicator,
  HurstExponentRTIndicator,
  IchimokuRTIndicator,
  KurtosisRTIndicator,
  LinearRegressionSlopeRTIndicator,
  MaxDrawdownRTIndicator,
  OmegaRatioRTIndicator,
  Pro,
  RealizedVolatilityRTIndicator,
  RollingPercentileRTIndicator,
  SharpeRatioRTIndicator,
  SimpleLinearRegressionRTIndicator,
  SkewnessRTIndicator,
  SortinoRatioRTIndicator,
  TailRatioRTIndicator,
  UlcerIndexRTIndicator,
  ValueAtRiskRTIndicator,
  YangZhangVolatilityRTIndicator,
  ZScoreRTIndicator,
} from "../src";
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
    klines(inputsOf("clean")).forEach((bar, i) => {
      map.updateFrom(bar);
      for (const [name, series] of Object.entries(names)) {
        expect(group.getIndicatorValue(name), `${name} at bar ${i}`).toBe(series[i]);
      }
    });
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
