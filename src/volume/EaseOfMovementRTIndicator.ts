import type { Kline, Ticker } from "@qtsurfer/core";
import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Ease of Movement: how easily the price moves, as a moving average of the distance moved over the volume per unit of
 * range,
 *
 * ```
 * distanceMoved = (high + low) / 2 - (prevHigh + prevLow) / 2
 * boxRatio      = (volume / 10000) / (high - low)
 * EMV           = distanceMoved / boxRatio
 * EOM           = SMA(EMV, periods)
 * ```
 *
 * High positive values mean the price rises on low volume. 14 periods by default; the first bar only sets the previous
 * high and low, and the EMV is 0 when the range or the volume is 0. A bar whose high, low or volume is not finite (NaN
 * or an infinity) is left out: nothing is updated and the last value is returned. So is a bar whose EMV, or the running
 * sum with it, is not finite, which takes a price or a volume near the largest double, or a volume so small that the
 * box ratio is hardly above 0; the previous bar stays the reference. The constructor throws a `RangeError` for
 * `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.EaseOfMovementRTIndicator
 */
export class EaseOfMovementRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _periods: number;
  private readonly emvWindow: WindowSeriesStore;
  private emvSum = 0;
  private prevHigh = 0;
  private prevLow = 0;
  private initialized = false;

  constructor(periods: number = 14) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.emvWindow = new WindowSeriesStore(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.initialized && this.emvWindow.size === this._periods;
  }

  override reset(): void {
    super.reset();
    this.emvWindow.clear();
    this.emvSum = 0;
    this.prevHigh = 0;
    this.prevLow = 0;
    this.initialized = false;
  }

  /** It reads the high, low and volume of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateHLV(bar.high, bar.low, bar.volume);
  }

  updateHLV(high: number, low: number, volume: number): number {
    if (AbstractRTIndicator.isPoison(high) || AbstractRTIndicator.isPoison(low) || AbstractRTIndicator.isPoison(volume)) {
      return this.getValue();
    }
    if (!this.initialized) {
      this.prevHigh = high;
      this.prevLow = low;
      this.initialized = true;
      return this.setValue(0);
    }

    const distanceMoved = (high + low) / 2.0 - (this.prevHigh + this.prevLow) / 2.0;
    const range = high - low;
    let emv: number;
    if (range === 0 || volume === 0) {
      emv = 0;
    } else {
      const boxRatio = volume / 10000.0 / range;
      emv = boxRatio !== 0 ? distanceMoved / boxRatio : 0;
    }

    const evicted = this.emvWindow.size === this._periods ? this.emvWindow.getValue(0) : 0;
    const nextSum = this.emvSum - evicted + emv;
    if (AbstractRTIndicator.isPoison(emv) || AbstractRTIndicator.isPoison(nextSum)) {
      return this.getValue();
    }

    this.prevHigh = high;
    this.prevLow = low;
    this.emvWindow.add(emv);
    this.emvSum = nextSum;

    const size = this.emvWindow.size;
    return this.setValue(size > 0 ? this.emvSum / size : 0);
  }

  override update(newValue: number): number {
    return this.updateHLV(newValue, newValue, 0);
  }
}
