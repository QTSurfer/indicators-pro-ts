import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Accumulation/Distribution Line: a running total that adds the volume of each bar weighted by where the close sits in
 * the range of the bar,
 *
 * ```
 * CLV  = ((close - low) - (high - close)) / (high - low)
 * ADL += CLV * volume
 * ```
 *
 * Like On-Balance Volume, but the weight goes from -1 (close at the low) to 1 (close at the high). A bar whose high,
 * low, close or volume is not finite (NaN or an infinity) is left out: the last value is returned. So is a bar that
 * would carry the running total out of the finite range. The class is ready after its first bar that is not left out.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.AdlRTIndicator
 */
export class AdlRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private adl = 0;
  private started = false;

  override isReady(): boolean {
    return this.started;
  }

  override reset(): void {
    super.reset();
    this.adl = 0;
    this.started = false;
  }

  /** It reads the high, low, close and volume of a bar, which a ticker only gives as 24-hour statistics. */
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
    const range = high - low;
    const clv = range !== 0 ? (close - low - (high - close)) / range : 0;
    const next = this.adl + clv * volume;
    if (AbstractRTIndicator.isPoison(next)) {
      return this.getValue();
    }
    this.started = true;
    this.adl = next;
    return this.setValue(this.adl);
  }

  override update(newValue: number): number {
    return this.updateHLCV(newValue, newValue, newValue, 0);
  }
}
