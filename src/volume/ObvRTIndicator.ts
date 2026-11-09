import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * On-Balance Volume: a running total that adds the bar's volume when the close rises and subtracts
 * it when the close falls.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.ObvRTIndicator
 */
export class ObvRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private obv = 0;
  private prevClose = 0;
  private initialized = false;

  override reset(): void {
    super.reset();
    this.obv = 0;
    this.prevClose = 0;
    this.initialized = false;
  }

  /** It reads the volume of a bar, which a ticker only gives as a 24-hour statistic. */
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
      return this.setValue(this.obv);
    }
    if (close > this.prevClose) {
      this.obv += volume;
    } else if (close < this.prevClose) {
      this.obv -= volume;
    }
    this.prevClose = close;
    return this.setValue(this.obv);
  }

  override update(newValue: number): number {
    return this.updateCV(newValue, 0);
  }
}
