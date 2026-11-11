import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Williams %R: how far the close is below the highest high of the window,
 *
 * ```
 * %R = (highestHigh - close) / (highestHigh - lowestLow) * -100
 * ```
 *
 * From 0 to -100: above -20 is overbought and below -80 is oversold. 0 when the window has no range; 14 periods by
 * default. A bar whose high, low or close is not finite (NaN or an infinity) is left out: nothing is updated and the
 * last value is returned. The ratio is not checked: a close or a range near the largest double can make it not finite.
 * The constructor throws a `RangeError` for `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.WilliamsRRTIndicator
 */
export class WilliamsRRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _periods: number;
  private readonly highs: Float64Array;
  private readonly lows: Float64Array;
  private head = 0;
  private count = 0;

  constructor(periods: number = 14) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.highs = new Float64Array(periods);
    this.lows = new Float64Array(periods);
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
  }

  /** It reads the high, low and close of a bar, which a ticker only gives as 24-hour statistics. */
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
    const idx = this.count < periods ? this.count : this.head;
    if (this.count >= periods) this.head = (this.head + 1) % periods;
    else this.count++;
    this.highs[idx] = high;
    this.lows[idx] = low;

    let hh = Number.NEGATIVE_INFINITY;
    let ll = Number.POSITIVE_INFINITY;
    const n = Math.min(this.count, periods);
    for (let i = 0; i < n; i++) {
      const bi = this.count < periods ? i : (this.head + i) % periods;
      if (this.highs[bi] > hh) hh = this.highs[bi];
      if (this.lows[bi] < ll) ll = this.lows[bi];
    }
    const range = hh - ll;
    return this.setValue(range !== 0 ? ((hh - close) / range) * -100 : 0);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
