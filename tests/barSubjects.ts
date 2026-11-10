import type { Kline } from "@qtsurfer/core";
import { AtrRTIndicator } from "@qtsurfer/indicators";
import { expect } from "vitest";
import { GarmanKlassVolatilityRTIndicator } from "$statistics/volatility/GarmanKlassVolatilityRTIndicator";
import { ParkinsonVolatilityRTIndicator } from "$statistics/volatility/ParkinsonVolatilityRTIndicator";
import { RogersSatchellVolatilityRTIndicator } from "$statistics/volatility/RogersSatchellVolatilityRTIndicator";
import { YangZhangVolatilityRTIndicator } from "$statistics/volatility/YangZhangVolatilityRTIndicator";
import { AdxRTIndicator } from "$trend/AdxRTIndicator";
import { AroonRTIndicator } from "$trend/AroonRTIndicator";
import { ChandeKrollStopRTIndicator } from "$trend/ChandeKrollStopRTIndicator";
import { ChandelierExitRTIndicator } from "$trend/ChandelierExitRTIndicator";
import { DonchianChannelRTIndicator } from "$trend/DonchianChannelRTIndicator";
import { IchimokuRTIndicator } from "$trend/IchimokuRTIndicator";
import { ParabolicSarRTIndicator } from "$trend/ParabolicSarRTIndicator";
import { SuperTrendRTIndicator } from "$trend/SuperTrendRTIndicator";
import { VortexRTIndicator } from "$trend/VortexRTIndicator";
import { ChoppinessIndexRTIndicator } from "$volatility/ChoppinessIndexRTIndicator";
import { KeltnerChannelRTIndicator } from "$volatility/KeltnerChannelRTIndicator";
import { MassIndexRTIndicator } from "$volatility/MassIndexRTIndicator";
import { NatrRTIndicator } from "$volatility/NatrRTIndicator";
import { CmfRTIndicator } from "$volume/CmfRTIndicator";
import { MfiRTIndicator } from "$volume/MfiRTIndicator";
import { ObvRTIndicator } from "$volume/ObvRTIndicator";
import { VwapRTIndicator } from "$volume/VwapRTIndicator";
import { LOG_TOLERANCE, decode, expectSeries } from "./compare";
import type { BarEdgeExpected, SeriesSet } from "./fixtures";

/**
 * The indicators that read whole bars, each with the parameters the Java oracle gives it
 * (tools/java-oracle/Oracle.java): the series it gives on a series of bars, fed through `updateFrom`, by output.
 * `value` is `getValue()` after each bar, the other outputs are its getters read after each bar.
 */
export interface BarSubject {
  /** The key of the series in `reference.json`. */
  key: string;
  label: string;
  /** Whether the two scenarios hold it too: the older ones have their own tests there, a few variants only matter on the edges. */
  scenarios: boolean;
  /** 0 when the indicator only uses + - * / and sqrt; `LOG_TOLERANCE` when it takes logarithms. */
  tolerance: number;
  run(bars: readonly Kline[]): Record<string, number[]>;
}

type Reads<T> = Record<string, (indicator: T) => number>;

function barSeries<T extends { updateFrom(bar: Kline): void; getValue(): number }>(
  indicator: T,
  bars: readonly Kline[],
  reads: Reads<T> = {},
): Record<string, number[]> {
  const out: Record<string, number[]> = { value: [] };
  for (const name of Object.keys(reads)) out[name] = [];
  for (const bar of bars) {
    indicator.updateFrom(bar);
    out.value.push(indicator.getValue());
    for (const [name, read] of Object.entries(reads)) out[name].push(read(indicator));
  }
  return out;
}

const ready = (indicator: { isReady(): boolean }): number => (indicator.isReady() ? 1 : 0);
const flag = (value: boolean): number => (value ? 1 : 0);

function subject(key: string, label: string, scenarios: boolean, tolerance: number, run: BarSubject["run"]): BarSubject {
  return { key, label, scenarios, tolerance, run };
}

export const barSubjects: BarSubject[] = [
  // ported before: only the bar edges run them (ATR is a free indicator, held to Java's here because several classes build on it)
  subject("adx14", "ADX(14)", false, 0, (b) =>
    barSeries(new AdxRTIndicator(14), b, { plusDI: (i) => i.getPlusDI(), minusDI: (i) => i.getMinusDI(), ready }),
  ),
  subject("ichimoku9_26_52", "Ichimoku(9, 26, 52)", false, 0, (b) =>
    barSeries(new IchimokuRTIndicator(9, 26, 52), b, {
      kijun: (i) => i.getKijunSen(),
      senkouA: (i) => i.getSenkouSpanA(),
      senkouB: (i) => i.getSenkouSpanB(),
      chikou: (i) => i.getChikouSpan(),
      tenkanKijunReady: (i) => flag(i.isTenkanKijunReady()),
      ready,
    }),
  ),
  subject("superTrend10_3", "SuperTrend(10, 3)", false, 0, (b) =>
    barSeries(new SuperTrendRTIndicator(10, 3.0), b, {
      upper: (i) => i.getUpperBand(),
      lower: (i) => i.getLowerBand(),
      upTrend: (i) => flag(i.isUpTrend()),
      ready,
    }),
  ),
  subject("atr14", "ATR(14)", false, 0, (b) => barSeries(new AtrRTIndicator(14), b, { ready })),
  subject("cmf20", "CMF(20)", false, 0, (b) => barSeries(new CmfRTIndicator(20), b, { ready })),
  subject("mfi14", "MFI(14)", false, 0, (b) => barSeries(new MfiRTIndicator(14), b, { ready })),
  subject("obv", "OBV", false, 0, (b) => barSeries(new ObvRTIndicator(), b, { ready })),
  subject("vwap", "VWAP", false, 0, (b) => barSeries(new VwapRTIndicator(), b, { ready })),
  subject("parkinson20", "Parkinson(20)", false, LOG_TOLERANCE, (b) =>
    barSeries(new ParkinsonVolatilityRTIndicator(20), b, { variance: (i) => i.getParkinsonVariance(), ready }),
  ),
  subject("garmanKlass20", "Garman-Klass(20)", false, LOG_TOLERANCE, (b) =>
    barSeries(new GarmanKlassVolatilityRTIndicator(20), b, { variance: (i) => i.getGarmanKlassVariance(), ready }),
  ),
  subject("rogersSatchell20", "Rogers-Satchell(20)", false, LOG_TOLERANCE, (b) =>
    barSeries(new RogersSatchellVolatilityRTIndicator(20), b, { variance: (i) => i.getRogersSatchellVariance(), ready }),
  ),
  subject("yangZhang20", "Yang-Zhang(20)", false, LOG_TOLERANCE, (b) =>
    barSeries(new YangZhangVolatilityRTIndicator(20), b, { variance: (i) => i.getYangZhangVariance(), ready }),
  ),

  subject("aroonDefault", "Aroon()", true, 0, (b) =>
    barSeries(new AroonRTIndicator(), b, { up: (i) => i.getAroonUp(), down: (i) => i.getAroonDown(), ready }),
  ),
  subject("aroon5", "Aroon(5)", true, 0, (b) =>
    barSeries(new AroonRTIndicator(5), b, { up: (i) => i.getAroonUp(), down: (i) => i.getAroonDown(), ready }),
  ),
  subject("chandeKrollStopDefault", "Chande Kroll stop()", true, 0, (b) =>
    barSeries(new ChandeKrollStopRTIndicator(), b, { stopLong: (i) => i.getStopLong(), stopShort: (i) => i.getStopShort(), ready }),
  ),
  subject("chandeKrollStop5_2_5_4_3", "Chande Kroll stop(5, 2.5, 4, 3)", true, 0, (b) =>
    barSeries(new ChandeKrollStopRTIndicator(5, 2.5, 4, 3), b, { stopLong: (i) => i.getStopLong(), stopShort: (i) => i.getStopShort(), ready }),
  ),
  subject("chandeKrollStopMultiplier0", "Chande Kroll stop(3, 0, 4, 2), a multiplier of 0", false, 0, (b) =>
    barSeries(new ChandeKrollStopRTIndicator(3, 0.0, 4, 2), b, { stopLong: (i) => i.getStopLong(), stopShort: (i) => i.getStopShort(), ready }),
  ),
  subject("chandeKrollStopHugeMultiplier", "Chande Kroll stop(3, 1e308, 4, 2), a multiplier that overflows the ATR", false, 0, (b) =>
    barSeries(new ChandeKrollStopRTIndicator(3, 1e308, 4, 2), b, { stopLong: (i) => i.getStopLong(), stopShort: (i) => i.getStopShort(), ready }),
  ),
  subject("chandelierExitDefault", "Chandelier exit()", true, 0, (b) =>
    barSeries(new ChandelierExitRTIndicator(), b, { longExit: (i) => i.getLongExit(), shortExit: (i) => i.getShortExit(), ready }),
  ),
  subject("chandelierExit5_1_5", "Chandelier exit(5, 1.5)", true, 0, (b) =>
    barSeries(new ChandelierExitRTIndicator(5, 1.5), b, { longExit: (i) => i.getLongExit(), shortExit: (i) => i.getShortExit(), ready }),
  ),
  subject("chandelierExitMultiplier0", "Chandelier exit(4, 0), a multiplier of 0", false, 0, (b) =>
    barSeries(new ChandelierExitRTIndicator(4, 0.0), b, { longExit: (i) => i.getLongExit(), shortExit: (i) => i.getShortExit(), ready }),
  ),
  subject("chandelierExitHugeMultiplier", "Chandelier exit(3, 1e308), a multiplier that overflows the ATR", false, 0, (b) =>
    barSeries(new ChandelierExitRTIndicator(3, 1e308), b, { longExit: (i) => i.getLongExit(), shortExit: (i) => i.getShortExit(), ready }),
  ),
  subject("donchianChannelDefault", "Donchian channel()", true, 0, (b) =>
    barSeries(new DonchianChannelRTIndicator(), b, {
      upper: (i) => i.getUpper(),
      lower: (i) => i.getLower(),
      middle: (i) => i.getMiddle(),
      ready,
    }),
  ),
  subject("donchianChannel5", "Donchian channel(5)", true, 0, (b) =>
    barSeries(new DonchianChannelRTIndicator(5), b, { upper: (i) => i.getUpper(), lower: (i) => i.getLower(), ready }),
  ),
  subject("parabolicSarDefault", "Parabolic SAR()", true, 0, (b) =>
    barSeries(new ParabolicSarRTIndicator(), b, { upTrend: (i) => flag(i.isUpTrend()), ready }),
  ),
  subject("parabolicSar005_05", "Parabolic SAR(0.05, 0.5)", true, 0, (b) =>
    barSeries(new ParabolicSarRTIndicator(0.05, 0.5), b, { upTrend: (i) => flag(i.isUpTrend()), ready }),
  ),
  subject("parabolicSarMaxBelowStep", "Parabolic SAR(0.1, 0.05), a maximum below the step", false, 0, (b) =>
    barSeries(new ParabolicSarRTIndicator(0.1, 0.05), b, { upTrend: (i) => flag(i.isUpTrend()), ready }),
  ),
  subject("vortexDefault", "Vortex()", true, 0, (b) =>
    barSeries(new VortexRTIndicator(), b, { viPlus: (i) => i.getVIPlus(), viMinus: (i) => i.getVIMinus(), ready }),
  ),
  subject("vortex3", "Vortex(3)", true, 0, (b) =>
    barSeries(new VortexRTIndicator(3), b, { viPlus: (i) => i.getVIPlus(), viMinus: (i) => i.getVIMinus(), ready }),
  ),
  subject("choppinessIndexDefault", "Choppiness index()", true, LOG_TOLERANCE, (b) =>
    barSeries(new ChoppinessIndexRTIndicator(), b, { ready }),
  ),
  subject("choppinessIndex5", "Choppiness index(5)", true, LOG_TOLERANCE, (b) => barSeries(new ChoppinessIndexRTIndicator(5), b, { ready })),
  subject("choppinessIndex1", "Choppiness index(1), which is always 0", false, LOG_TOLERANCE, (b) =>
    barSeries(new ChoppinessIndexRTIndicator(1), b, { ready }),
  ),
  subject("keltnerChannelDefault", "Keltner channel()", true, 0, (b) =>
    barSeries(new KeltnerChannelRTIndicator(), b, {
      upper: (i) => i.getUpper(),
      lower: (i) => i.getLower(),
      middle: (i) => i.getMiddle(),
      ready,
    }),
  ),
  subject("keltnerChannel5_3_2", "Keltner channel(5, 3, 2)", true, 0, (b) =>
    barSeries(new KeltnerChannelRTIndicator(5, 3, 2.0), b, { upper: (i) => i.getUpper(), lower: (i) => i.getLower(), ready }),
  ),
  subject("keltnerChannelMultiplier0", "Keltner channel(5, 3, 0), a multiplier of 0", false, 0, (b) =>
    barSeries(new KeltnerChannelRTIndicator(5, 3, 0.0), b, { upper: (i) => i.getUpper(), lower: (i) => i.getLower(), ready }),
  ),
  subject("keltnerChannelHugeMultiplier", "Keltner channel(3, 3, 1e308), a multiplier that overflows the ATR", false, 0, (b) =>
    barSeries(new KeltnerChannelRTIndicator(3, 3, 1e308), b, { upper: (i) => i.getUpper(), lower: (i) => i.getLower(), ready }),
  ),
  subject("massIndexDefault", "Mass index()", true, 0, (b) => barSeries(new MassIndexRTIndicator(), b, { ready })),
  subject("massIndex5_3", "Mass index(5, 3)", true, 0, (b) => barSeries(new MassIndexRTIndicator(5, 3), b, { ready })),
  subject("massIndex1_1", "Mass index(1, 1)", false, 0, (b) => barSeries(new MassIndexRTIndicator(1, 1), b, { ready })),
  subject("natr14", "NATR(14)", true, 0, (b) => barSeries(new NatrRTIndicator(14), b, { ready })),
  subject("natr3", "NATR(3)", true, 0, (b) => barSeries(new NatrRTIndicator(3), b, { ready })),
];

/** The bars of a bar edge: a field that is a string in the fixture (NaN, Infinity, -Infinity) is that number. */
export function barsOfEdge(edge: Pick<BarEdgeExpected, "open" | "high" | "low" | "close" | "volume">): Kline[] {
  return edge.close.map((encodedClose, i) => {
    const close = decode(encodedClose);
    const volume = decode(edge.volume[i]);
    return {
      instrument: "BTC/USDT",
      open: decode(edge.open[i]),
      high: decode(edge.high[i]),
      low: decode(edge.low[i]),
      close,
      volume,
      quoteVolume: volume * close,
      numberOfTrades: 5,
      timestamp: i * 60_000 + 59_999,
    };
  });
}

/** Runs a subject on the bars and compares each of its outputs with Java's. */
export function expectBarSubject(subject: BarSubject, bars: readonly Kline[], expected: SeriesSet, label: string): void {
  const actual = subject.run(bars);
  expect(Object.keys(actual).sort(), `${label}: outputs`).toEqual(Object.keys(expected).sort());
  for (const output of Object.keys(expected)) {
    expectSeries(actual[output], expected[output], `${label} ${output}`, subject.tolerance);
  }
}
