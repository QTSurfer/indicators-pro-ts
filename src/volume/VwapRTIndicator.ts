import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Volume-Weighted Average Price: the cumulative sum of typical price times volume over the
 * cumulative volume. Reset it at the start of each session.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.VwapRTIndicator
 */
export class VwapRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private cumulativeTPV = 0;
  private cumulativeVolume = 0;

  override reset(): void {
    super.reset();
    this.cumulativeTPV = 0;
    this.cumulativeVolume = 0;
  }

  /** It reads the volume of a bar, which a ticker only gives as a 24-hour statistic. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateHLCV(bar.high, bar.low, bar.close, bar.volume);
  }

  updateHLCV(high: number, low: number, close: number, volume: number): number {
    if (
      AbstractRTIndicator.isPoison(high) ||
      AbstractRTIndicator.isPoison(low) ||
      AbstractRTIndicator.isPoison(close) ||
      AbstractRTIndicator.isPoison(volume)
    ) {
      return this.getValue();
    }
    const tp = (high + low + close) / 3.0;
    this.cumulativeTPV += tp * volume;
    this.cumulativeVolume += volume;
    const vwap = this.cumulativeVolume !== 0 ? this.cumulativeTPV / this.cumulativeVolume : 0;
    return this.setValue(vwap);
  }

  override update(newValue: number): number {
    return this.updateHLCV(newValue, newValue, newValue, 0);
  }
}
