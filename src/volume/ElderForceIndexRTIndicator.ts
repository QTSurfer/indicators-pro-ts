import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, EmaRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Elder Force Index: the power behind a move, as an EMA of the change of the close times the volume,
 *
 * ```
 * EFI = EMA((close - prevClose) * volume, periods)
 * ```
 *
 * Positive values mean buying pressure and negative values selling pressure. 13 periods by default; the first bar only
 * sets the previous close. A bar whose close or volume is not finite (NaN or an infinity) is left out: nothing is
 * updated and the last value is returned. So is a bar whose force overflows, which takes a volume or a move near the
 * largest double; the previous close stays the reference. The constructor throws a `RangeError` for `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.ElderForceIndexRTIndicator
 */
export class ElderForceIndexRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _periods: number;
  private readonly ema: EmaRTIndicator;
  private prevClose = 0;
  private initialized = false;

  constructor(periods: number = 13) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.ema = new EmaRTIndicator(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.initialized && this.ema.isReady();
  }

  override reset(): void {
    super.reset();
    this.ema.reset();
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
      return this.setValue(0);
    }
    const forceRaw = (close - this.prevClose) * volume;
    if (AbstractRTIndicator.isPoison(forceRaw)) {
      return this.getValue();
    }
    this.prevClose = close;
    const result = this.ema.update(forceRaw);
    return this.setValue(result);
  }

  override update(newValue: number): number {
    return this.updateCV(newValue, 0);
  }
}
