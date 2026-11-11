import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Chaikin Money Flow: the money flow volume over the volume of a window, from -1 to 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.CmfRTIndicator
 */
export class CmfRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly mfvBuffer: Float64Array; // money flow volume
  private readonly volBuffer: Float64Array; // volume
  private head = 0;
  private count = 0;
  private mfvSum = 0;
  private volSum = 0;

  constructor(private readonly _periods: number = 20) {
    super();
    if (_periods < 0) {
      throw new RangeError(`Periods must be >= 0, got: ${_periods}`);
    }
    this.mfvBuffer = new Float64Array(_periods);
    this.volBuffer = new Float64Array(_periods);
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
    this.mfvSum = 0;
    this.volSum = 0;
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
    const periods = this._periods;
    const range = high - low;
    const mfm = range !== 0 ? (close - low - (high - close)) / range : 0;
    const mfv = mfm * volume;

    let idx: number;
    if (this.count >= periods) {
      idx = this.head;
      this.mfvSum -= this.mfvBuffer[idx];
      this.volSum -= this.volBuffer[idx];
      this.head = (this.head + 1) % periods;
    } else {
      idx = this.count;
      this.count++;
    }
    this.mfvBuffer[idx] = mfv;
    this.volBuffer[idx] = volume;
    this.mfvSum += mfv;
    this.volSum += volume;

    const cmf = this.volSum !== 0 ? this.mfvSum / this.volSum : 0;
    return this.setValue(cmf);
  }

  override update(newValue: number): number {
    return this.updateHLCV(newValue, newValue, newValue, 0);
  }
}
