import { DisplayHint, IndicatorMeta, PlotSide, PlotStyle, type AbstractRTIndicator } from "@qtsurfer/indicators";

/** One output of a row, other than the main one. */
interface Out {
  readonly side: PlotSide;
  readonly drawn: boolean;
  readonly boundary: boolean;
}

/** One indicator's row. */
export class Row {
  private unitValue: DisplayHint = DisplayHint.ABSOLUTE;
  private overlayValue = false;
  private rangeValue: readonly [number, number] | null = null;
  private floorValue: number | null = null;
  private zeroLine = false;
  private style: PlotStyle = PlotStyle.LINE;
  private side: PlotSide = PlotSide.NONE;
  private drawn = true;
  readonly outputs = new Map<string, Out>();

  unit(unit: DisplayHint): this {
    this.unitValue = unit;
    return this;
  }

  overlay(): this {
    this.overlayValue = true;
    return this;
  }

  range(min: number, max: number): this {
    this.rangeValue = [min, max];
    return this;
  }

  floor(floor: number): this {
    this.floorValue = floor;
    return this;
  }

  zero(): this {
    this.zeroLine = true;
    return this;
  }

  histogram(): this {
    this.style = PlotStyle.HISTOGRAM;
    return this;
  }

  dots(): this {
    this.style = PlotStyle.DOTS;
    return this;
  }

  /** The main output means the negative side. */
  down(): this {
    this.side = PlotSide.DOWN;
    return this;
  }

  /** The main output is registered but not drawn by default. */
  notDrawn(): this {
    this.drawn = false;
    return this;
  }

  /**
   * Another output, named by its suffix, with its flags: `u` the positive side, `d` the negative
   * side, `x` not drawn by default, `b` a boundary (a band edge).
   */
  out(suffix: string, flags = ""): this {
    this.outputs.set(suffix, {
      side: flags.includes("u") ? PlotSide.UP : flags.includes("d") ? PlotSide.DOWN : PlotSide.NONE,
      drawn: !flags.includes("x"),
      boundary: flags.includes("b"),
    });
    return this;
  }

  applyInstance(meta: IndicatorMeta): void {
    meta.setDisplayHint(this.unitValue).setOverlay(this.overlayValue);
    if (this.rangeValue !== null) {
      meta.setRange(this.rangeValue[0], this.rangeValue[1]);
    }
    if (this.floorValue !== null) {
      meta.setFloor(this.floorValue);
    }
    if (this.zeroLine) {
      meta.setLevels(0);
    }
  }

  applyMain(meta: IndicatorMeta): void {
    this.applyInstance(meta);
    meta.setPlotStyle(this.style).setPlotSide(this.side).setDrawnByDefault(this.drawn);
  }
}

const ROWS = new Map<string, Row>();

function row(id: string): Row {
  const created = new Row();
  ROWS.set(id, created);
  return created;
}

// averages: in the units of the price, over it
row("alma").overlay();
row("dema").overlay();
row("frama").overlay();
row("leastSquaresMovingAverage").overlay();
row("mcGinleyDynamic").overlay();

// oscillators
row("acceleratorOscillator").zero().histogram();
row("adaptiveFisherTransform").unit(DisplayHint.NUMBER).zero();
row("awesomeOscillator").zero().histogram();
row("balanceOfPower").unit(DisplayHint.RATIO).range(-1, 1).zero();
row("bullBearPower").zero().notDrawn().out("Bull", "u").out("Bear", "d");
row("chandeForecastOscillator").unit(DisplayHint.PERCENT).zero();
row("cmo").unit(DisplayHint.INDEX).range(-100, 100).zero();
row("connorsRsi").unit(DisplayHint.INDEX).range(0, 100);
row("coppockCurve").unit(DisplayHint.NUMBER).zero();
row("detrendedPriceOscillator").zero();
row("fisherTransform").unit(DisplayHint.NUMBER).zero();
row("knowSureThing").unit(DisplayHint.NUMBER).zero().out("Signal");
row("momentum").zero();
row("relativeVigorIndex").unit(DisplayHint.RATIO).range(-1, 1).zero();
row("roc").unit(DisplayHint.PERCENT).zero();
row("stochasticOscillator").unit(DisplayHint.PERCENT).range(0, 100).out("D");
row("trix").unit(DisplayHint.PERCENT).zero();
row("trueStrengthIndex").unit(DisplayHint.INDEX).range(-100, 100).zero();
row("ultimateOscillator").unit(DisplayHint.PERCENT).range(0, 100);
row("williamsR").unit(DisplayHint.PERCENT).range(-100, 0);

// bands
row("donchianChannel").overlay().out("Upper", "b").out("Lower", "b");
row("envelopes").overlay().out("Upper", "b").out("Lower", "b");
row("keltnerChannel").overlay().out("Upper", "b").out("Lower", "b");

// volatility
row("choppinessIndex").unit(DisplayHint.PERCENT).range(0, 100);
row("ewmaVolatility").unit(DisplayHint.FRACTION).floor(0);
row("garmanKlass").unit(DisplayHint.FRACTION);
row("massIndex").unit(DisplayHint.INDEX).floor(0);
row("natr").unit(DisplayHint.PERCENT).floor(0);
row("parkinson").unit(DisplayHint.FRACTION);
row("realizedVolatility").unit(DisplayHint.FRACTION).floor(0);
row("relativeVolatilityIndex").unit(DisplayHint.PERCENT).range(0, 100);
row("rogersSatchell").unit(DisplayHint.FRACTION);
row("yangZhang").unit(DisplayHint.FRACTION);

// trend
row("adx").unit(DisplayHint.PERCENT).range(0, 100).out("PlusDI", "u").out("MinusDI", "d");
row("aroon").unit(DisplayHint.PERCENT).range(-100, 100).zero().out("Up", "u").out("Down", "d");
row("chandeKrollStop").overlay().out("StopShort", "d");
row("chandelierExit").overlay().out("ShortExit", "d");
row("efficiencyRatio").unit(DisplayHint.RATIO).range(0, 1);
row("ichimoku")
  .overlay()
  .out("Kijun")
  .out("SenkouA", "u")
  .out("SenkouB", "d")
  .out("Chikou", "x");
row("parabolicSar").overlay().dots();
row("superTrend").overlay().out("Upper", "xb").out("Lower", "xb");
row("vortex").unit(DisplayHint.RATIO).notDrawn().out("ViPlus", "u").out("ViMinus", "d");

// volume
row("adl").unit(DisplayHint.VOLUME);
row("chaikinOscillator").unit(DisplayHint.VOLUME).zero();
row("cmf").unit(DisplayHint.RATIO).range(-1, 1).zero();
row("easeOfMovement").unit(DisplayHint.NUMBER).zero();
row("elderForceIndex").unit(DisplayHint.VOLUME).zero();
row("klingerOscillator").unit(DisplayHint.VOLUME).zero().out("Signal");
row("mfi").unit(DisplayHint.PERCENT).range(0, 100);
row("negativeVolumeIndex").unit(DisplayHint.INDEX);
row("obv").unit(DisplayHint.VOLUME);
row("pvt").unit(DisplayHint.VOLUME);
row("vwap").overlay();

// statistics
row("autocorrelation").unit(DisplayHint.RATIO).range(-1, 1).zero();
row("exactStdDev").floor(0);
row("exactVariance").unit(DisplayHint.NUMBER).floor(0);
row("hurstExponent").unit(DisplayHint.NUMBER);
row("kurtosis").unit(DisplayHint.NUMBER).zero();
row("linearRegressionSlope").zero().out("Intercept", "x");
row("rollingPercentile").overlay().out("Median").out("Min").out("Max");
row("simpleLinearRegression")
  .zero()
  .out("Intercept", "x")
  .out("RSquared", "x")
  .out("StandardError", "x");
row("skewness").unit(DisplayHint.NUMBER).zero();
row("valueAtRisk").unit(DisplayHint.FRACTION);
row("zScore").unit(DisplayHint.NUMBER).zero();

// risk
row("calmarRatio").unit(DisplayHint.RATIO).zero();
row("maxDrawdown").unit(DisplayHint.FRACTION).range(0, 1).down().out("Current");
row("omegaRatio").unit(DisplayHint.RATIO).floor(0);
row("sharpeRatio").unit(DisplayHint.RATIO).zero();
row("sortinoRatio").unit(DisplayHint.RATIO).zero();
row("tailRatio").unit(DisplayHint.RATIO);
row("ulcerIndex").unit(DisplayHint.PERCENT).floor(0);

/**
 * What a chart needs to know about each pro indicator besides its values: where it goes, on what
 * scale, with what unit, and how each of its outputs is drawn. One row per `Pro` factory, keyed by
 * the factory's method name (the id QTScript uses), applied at the one place the facade registers
 * an indicator and its outputs.
 *
 * The keys and their meaning are those of `IndicatorMeta`. Two rules shape the table:
 *
 * - The keys of the instance (unit, placement, range, floor, levels) go to the main output and to
 *   every output that is drawn. An output that is not drawn by default carries only that fact: it
 *   is on another scale or derived, so what the instance says about its scale would not hold.
 * - The keys of one output (style, side, drawn, boundary) go to that output alone. The main output
 *   is the row itself; the other outputs are named by their suffix.
 *
 * Where the engine already tells a display hint, the engine's wins: a 0 to 100 oscillator that has
 * always been a percentage stays so (`stochasticOscillator`, `williamsR`, `adx`...), and changing it
 * is a separate, announced step.
 */
export const ProVisualization = {
  /** The row of a factory, or `undefined` when it has none. */
  find(id: string): Row | undefined {
    return ROWS.get(id);
  },

  /** The ids that have a row. */
  ids(): ReadonlySet<string> {
    return new Set(ROWS.keys());
  },

  /** Describes the main output of the factory `id`. Nothing happens when it has no row. */
  applyMain(id: string, indicator: AbstractRTIndicator): void {
    const row = ROWS.get(id);
    if (row === undefined) {
      return;
    }
    indicator.withMeta((meta) => row.applyMain(meta));
  },

  /**
   * Describes the output of the factory `id` named by `suffix`. Nothing happens when the factory
   * has no row or the row does not name that output.
   */
  applyOutput(id: string, suffix: string, view: AbstractRTIndicator): void {
    const row = ROWS.get(id);
    const out = row?.outputs.get(suffix);
    if (row === undefined || out === undefined) {
      return;
    }
    view.withMeta((meta) => {
      if (out.drawn) {
        row.applyInstance(meta);
      }
      meta.setPlotSide(out.side).setDrawnByDefault(out.drawn);
      if (out.boundary) {
        meta.set(IndicatorMeta.BAND, suffix.toLowerCase());
      }
    });
  },
};
