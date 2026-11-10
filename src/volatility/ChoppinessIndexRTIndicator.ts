import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Choppiness Index: whether the market trends or ranges,
 *
 * ```
 * CHOP = 100 * log10(sum(TR, periods) / (highest high - lowest low)) / log10(periods)
 * ```
 *
 * From 0 to 100: above 61.8 the market is choppy (range-bound), below 38.2 it is trending. With one period, or with a
 * window whose highest high does not exceed its lowest low, the value is 0. A bar whose high, low or close is not
 * finite (NaN or an infinity) is left out: nothing is updated and the last value is returned. So is a bar whose true
 * range is not finite, which takes a price near the largest double; the previous close stays the reference. The
 * constructor throws a `RangeError` for `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.volatility.pro.ChoppinessIndexRTIndicator
 */
export class ChoppinessIndexRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _periods: number;
  private readonly trBuffer: Float64Array;
  private readonly highBuffer: Float64Array;
  private readonly lowBuffer: Float64Array;
  private readonly log10N: number;
  private head = 0;
  private count = 0;
  private prevClose = 0;
  private initialized = false;

  constructor(periods: number = 14) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.trBuffer = new Float64Array(periods);
    this.highBuffer = new Float64Array(periods);
    this.lowBuffer = new Float64Array(periods);
    this.log10N = Math.log10(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.count >= this._periods;
  }

  override reset(): void {
    super.reset();
    this.head = 0;
    this.count = 0;
    this.prevClose = 0;
    this.initialized = false;
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
    let tr: number;
    if (!this.initialized) {
      tr = high - low;
    } else {
      tr = Math.max(high - low, Math.max(Math.abs(high - this.prevClose), Math.abs(low - this.prevClose)));
    }
    if (AbstractRTIndicator.isPoison(tr)) {
      // Only reachable when a distance overflows (a price near the largest double): hold, and keep the previous close
      // as the reference.
      return this.getValue();
    }
    this.initialized = true;
    this.prevClose = close;

    let idx: number;
    if (this.count >= periods) {
      idx = this.head;
      this.head = (this.head + 1) % periods;
    } else {
      idx = this.count;
      this.count++;
    }

    this.trBuffer[idx] = tr;
    this.highBuffer[idx] = high;
    this.lowBuffer[idx] = low;

    // The sum of the true ranges, the highest high and the lowest low of the window
    let trSum = 0;
    let hh = Number.NEGATIVE_INFINITY;
    let ll = Number.POSITIVE_INFINITY;
    const n = Math.min(this.count, periods);
    for (let i = 0; i < n; i++) {
      const bi = this.count <= periods ? i : (this.head + i) % periods;
      trSum += this.trBuffer[bi];
      if (this.highBuffer[bi] > hh) hh = this.highBuffer[bi];
      if (this.lowBuffer[bi] < ll) ll = this.lowBuffer[bi];
    }

    const range = hh - ll;
    if (range <= 0 || this.log10N === 0) {
      return this.setValue(0);
    }

    const chop = (100.0 * Math.log10(trSum / range)) / this.log10N;
    return this.setValue(chop);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
