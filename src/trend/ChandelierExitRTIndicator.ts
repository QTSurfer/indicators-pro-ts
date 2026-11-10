import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, AtrRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";
import { javaDouble } from "$core/JavaNumber";

/**
 * Chandelier Exit: a trailing stop that hangs an ATR multiple from the highest high or the lowest low,
 *
 * ```
 * Exit Long  = highest high(periods) - multiplier * ATR(periods)
 * Exit Short = lowest low(periods)   + multiplier * ATR(periods)
 * ```
 *
 * The value is the long exit; `getShortExit` gives the other. A bar whose high, low or close is not finite (NaN or an
 * infinity) is left out: nothing is updated, the last value is returned and the short exit keeps its last value. The
 * exits are not checked: when `multiplier * ATR` overflows they are not finite. The constructor throws a `RangeError`
 * for `periods` below 1 and for a `multiplier` that is negative or not finite (0 is accepted: the exits then sit on the
 * highest high and the lowest low).
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.ChandelierExitRTIndicator
 */
export class ChandelierExitRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _periods: number;
  private readonly _multiplier: number;
  private readonly atr: AtrRTIndicator;
  private readonly highs: Float64Array;
  private readonly lows: Float64Array;
  private head = 0;
  private count = 0;
  private longExit = 0;
  private shortExit = 0;

  constructor();
  constructor(periods: number, multiplier: number);
  constructor(periods: number = 22, multiplier: number = 3.0) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    if (!(multiplier >= 0) || !Number.isFinite(multiplier)) {
      throw new RangeError(`Multiplier must be finite and >= 0, got: ${javaDouble(multiplier)}`);
    }
    this._periods = periods;
    this._multiplier = multiplier;
    this.atr = new AtrRTIndicator(periods);
    this.highs = new Float64Array(periods);
    this.lows = new Float64Array(periods);
  }

  get periods(): number {
    return this._periods;
  }

  getMultiplier(): number {
    return this._multiplier;
  }

  /** The exit of a long position, also the main value. */
  getLongExit(): number {
    return this.longExit;
  }

  /** The exit of a short position, as of the last update. */
  getShortExit(): number {
    return this.shortExit;
  }

  override isReady(): boolean {
    return this.atr.isReady();
  }

  override reset(): void {
    super.reset();
    this.atr.reset();
    this.head = 0;
    this.count = 0;
    this.longExit = 0;
    this.shortExit = 0;
  }

  /** It reads the high and low of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateOhlc(bar.high, bar.low, bar.close);
  }

  updateOhlc(high: number, low: number, close: number): number {
    if (AbstractRTIndicator.isPoison(high) || AbstractRTIndicator.isPoison(low) || AbstractRTIndicator.isPoison(close)) {
      return this.getValue();
    }
    const periods = this._periods;
    this.atr.updateOhlc(high, low, close);

    const idx = this.count < periods ? this.count : this.head;
    if (this.count >= periods) this.head = (this.head + 1) % periods;
    else this.count++;
    this.highs[idx] = high;
    this.lows[idx] = low;

    let hh = Number.NEGATIVE_INFINITY;
    let ll = Number.POSITIVE_INFINITY;
    const n = Math.min(this.count, periods);
    for (let i = 0; i < n; i++) {
      const bi = this.count <= periods ? i : (this.head + i) % periods;
      if (this.highs[bi] > hh) hh = this.highs[bi];
      if (this.lows[bi] < ll) ll = this.lows[bi];
    }

    const atrVal = this.atr.getValue();
    this.longExit = hh - this._multiplier * atrVal;
    this.shortExit = ll + this._multiplier * atrVal;
    return this.setValue(this.longExit);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
