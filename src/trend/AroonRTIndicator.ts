import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Aroon: how many bars ago the highest high and the lowest low of the window were,
 *
 * ```
 * Aroon Up         = (periods - barsSinceHigh) / periods * 100
 * Aroon Down       = (periods - barsSinceLow) / periods * 100
 * Aroon Oscillator = Aroon Up - Aroon Down
 * ```
 *
 * The value is the oscillator, from -100 to 100; `getAroonUp` and `getAroonDown` give the two lines. The window holds
 * `periods + 1` bars. A bar whose high or low is not finite (NaN or an infinity) is left out: nothing is updated, the
 * last value is returned and both lines keep their last values. The constructor throws a `RangeError` for `periods`
 * below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.AroonRTIndicator
 */
export class AroonRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _periods: number;
  private readonly bufSize: number;
  private readonly highs: Float64Array;
  private readonly lows: Float64Array;
  private writeIdx = 0;
  private count = 0;
  private aroonUp = 0;
  private aroonDown = 0;

  constructor(periods: number = 25) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.bufSize = periods + 1;
    this.highs = new Float64Array(this.bufSize);
    this.lows = new Float64Array(this.bufSize);
  }

  get periods(): number {
    return this._periods;
  }

  /** The Aroon Up line, as of the last update. */
  getAroonUp(): number {
    return this.aroonUp;
  }

  /** The Aroon Down line, as of the last update. */
  getAroonDown(): number {
    return this.aroonDown;
  }

  override isReady(): boolean {
    return this.count >= this.bufSize;
  }

  override reset(): void {
    super.reset();
    this.writeIdx = 0;
    this.count = 0;
    this.aroonUp = 0;
    this.aroonDown = 0;
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
    const bufSize = this.bufSize;
    this.highs[this.writeIdx] = high;
    this.lows[this.writeIdx] = low;
    this.writeIdx = (this.writeIdx + 1) % bufSize;
    if (this.count < bufSize) this.count++;

    // Scan back from the most recent bar for the most recent highest high and lowest low
    let periodsFromHigh = periods;
    let periodsFromLow = periods;
    let maxH = Number.NEGATIVE_INFINITY;
    let minL = Number.POSITIVE_INFINITY;
    const n = Math.min(this.count, bufSize);

    for (let i = 0; i < n; i++) {
      const bi = (this.writeIdx - 1 - i + bufSize) % bufSize;
      if (this.highs[bi] >= maxH) {
        maxH = this.highs[bi];
        periodsFromHigh = i;
      }
      if (this.lows[bi] <= minL) {
        minL = this.lows[bi];
        periodsFromLow = i;
      }
    }

    this.aroonUp = ((periods - periodsFromHigh) / periods) * 100;
    this.aroonDown = ((periods - periodsFromLow) / periods) * 100;
    return this.setValue(this.aroonUp - this.aroonDown);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue);
  }
}
