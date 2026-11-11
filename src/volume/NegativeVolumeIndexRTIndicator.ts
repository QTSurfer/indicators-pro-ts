import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

const INITIAL_VALUE = 1000.0;

/**
 * Negative Volume Index: follows the price only on the bars where the volume fell from the bar before, which is where
 * the "smart money" is said to act,
 *
 * ```
 * if volume < prevVolume: NVI = prevNVI + ((close - prevClose) / prevClose) * prevNVI
 * else:                   NVI = prevNVI
 * ```
 *
 * The index starts at 1000, but `getValue` is 0 until the first bar that is not left out. A bar whose close or volume is
 * not finite (NaN or an infinity) is left out: nothing is updated and the last value is returned. So is a bar whose
 * index is not finite, which takes a previous close that is hardly above 0 or a price near the largest double; the
 * previous close and volume stay the reference. The class is ready after its first bar that is not left out.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.NegativeVolumeIndexRTIndicator
 */
export class NegativeVolumeIndexRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private nvi = INITIAL_VALUE;
  private prevClose = 0;
  private prevVolume = 0;
  private initialized = false;

  override isReady(): boolean {
    return this.initialized;
  }

  override reset(): void {
    super.reset();
    this.nvi = INITIAL_VALUE;
    this.prevClose = 0;
    this.prevVolume = 0;
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
      this.prevVolume = volume;
      this.initialized = true;
      return this.setValue(this.nvi);
    }

    let next = this.nvi;
    if (volume < this.prevVolume && this.prevClose !== 0) {
      next = this.nvi + ((close - this.prevClose) / this.prevClose) * this.nvi;
    }
    if (AbstractRTIndicator.isPoison(next)) {
      return this.getValue();
    }
    this.nvi = next;

    this.prevClose = close;
    this.prevVolume = volume;
    return this.setValue(this.nvi);
  }

  override update(newValue: number): number {
    return this.updateCV(newValue, 0);
  }
}
