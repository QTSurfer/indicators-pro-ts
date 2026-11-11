import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Price Volume Trend: a running total that adds the volume of each bar weighted by the percentage change of the close,
 *
 * ```
 * PVT += ((close - prevClose) / prevClose) * volume
 * ```
 *
 * Like On-Balance Volume, but the volume is scaled by how far the price moved. The first bar only sets the previous
 * close, and a previous close of 0 adds nothing. A bar whose close or volume is not finite (NaN or an infinity) is left
 * out: nothing is updated and the last value is returned. So is a bar that would carry the running total out of the
 * finite range, which takes a previous close that is hardly above 0 or a volume near the largest double; the previous
 * close stays the reference. The class is ready after its first bar that is not left out.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.PvtRTIndicator
 */
export class PvtRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private pvt = 0;
  private prevClose = 0;
  private initialized = false;

  override isReady(): boolean {
    return this.initialized;
  }

  override reset(): void {
    super.reset();
    this.pvt = 0;
    this.prevClose = 0;
    this.initialized = false;
  }

  /** It reads the close and volume of a bar, which a ticker only gives as a last price and a 24-hour statistic. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateCV(bar.close, bar.volume);
  }

  updateCV(close: number, volume: number): number {
    if (AbstractRTIndicator.isPoison(close) || AbstractRTIndicator.isPoison(volume)) {
      return this.getValue();
    }
    if (!this.initialized) {
      this.prevClose = close;
      this.initialized = true;
      return this.setValue(this.pvt);
    }

    let next = this.pvt;
    if (this.prevClose !== 0) {
      next = this.pvt + ((close - this.prevClose) / this.prevClose) * volume;
    }
    if (AbstractRTIndicator.isPoison(next)) {
      return this.getValue();
    }
    this.pvt = next;
    this.prevClose = close;
    return this.setValue(this.pvt);
  }

  override update(newValue: number): number {
    return this.updateCV(newValue, 0);
  }
}
