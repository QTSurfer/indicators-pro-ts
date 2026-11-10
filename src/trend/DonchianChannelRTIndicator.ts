import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Donchian Channel: the highest high and the lowest low of the window,
 *
 * ```
 * Upper  = max(high, periods)
 * Lower  = min(low, periods)
 * Middle = (Upper + Lower) / 2
 * ```
 *
 * The value is the middle line; `getUpper` and `getLower` give the boundaries, which are -Infinity and Infinity until
 * the first bar. A bar whose high or low is not finite (NaN or an infinity) is left out: nothing is updated, the last
 * value is returned and the boundaries keep their last values. The middle line is not checked: when the boundaries are
 * far apart enough to overflow their sum it is not finite. The constructor throws a `RangeError` for `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.DonchianChannelRTIndicator
 */
export class DonchianChannelRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _periods: number;
  private readonly highs: Float64Array;
  private readonly lows: Float64Array;
  private head = 0;
  private count = 0;
  private upper: number;
  private lower: number;

  constructor(periods: number = 20) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.highs = new Float64Array(periods);
    this.lows = new Float64Array(periods);
    this.upper = Number.NEGATIVE_INFINITY;
    this.lower = Number.POSITIVE_INFINITY;
  }

  get periods(): number {
    return this._periods;
  }

  getUpper(): number {
    return this.upper;
  }

  getLower(): number {
    return this.lower;
  }

  /** The middle line, also the main value. */
  getMiddle(): number {
    return this.getValue();
  }

  override isReady(): boolean {
    return this.count >= this._periods;
  }

  override reset(): void {
    super.reset();
    this.head = 0;
    this.count = 0;
    this.upper = Number.NEGATIVE_INFINITY;
    this.lower = Number.POSITIVE_INFINITY;
  }

  /** It reads the high and low of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateOhlc(bar.high, bar.low);
  }

  updateOhlc(high: number, low: number): number {
    if (AbstractRTIndicator.isPoison(high) || AbstractRTIndicator.isPoison(low)) {
      return this.getValue();
    }
    const periods = this._periods;
    let idx: number;
    const evicted = this.count >= periods;

    if (evicted) {
      idx = this.head;
      this.head = (this.head + 1) % periods;
    } else {
      idx = this.count;
      this.count++;
    }

    this.highs[idx] = high;
    this.lows[idx] = low;

    if (!evicted) {
      // Growing phase: the extremes are updated incrementally
      if (high > this.upper) this.upper = high;
      if (low < this.lower) this.lower = low;
    } else {
      // Eviction: the value that left may have been an extreme, so the window is scanned
      this.upper = Number.NEGATIVE_INFINITY;
      this.lower = Number.POSITIVE_INFINITY;
      for (let i = 0; i < periods; i++) {
        const bi = (this.head + i) % periods;
        if (this.highs[bi] > this.upper) this.upper = this.highs[bi];
        if (this.lows[bi] < this.lower) this.lower = this.lows[bi];
      }
    }

    return this.setValue((this.upper + this.lower) / 2.0);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue);
  }
}
