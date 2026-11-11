import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Money Flow Index: a volume-weighted RSI, 0 to 100, from the money flow of the typical price over a
 * window. The first bar only sets the previous typical price and reads 50.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.MfiRTIndicator
 */
export class MfiRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly flows: Float64Array; // positive values are positive flow, negative are negative
  private head = 0;
  private count = 0;
  private prevTP = 0;
  private positiveSum = 0;
  private negativeSum = 0;
  private initialized = false;

  constructor(private readonly _periods: number = 14) {
    super();
    if (_periods < 0) {
      throw new RangeError(`Periods must be >= 0, got: ${_periods}`);
    }
    this.flows = new Float64Array(_periods);
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
    this.prevTP = 0;
    this.positiveSum = 0;
    this.negativeSum = 0;
    this.initialized = false;
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
    const tp = (high + low + close) / 3.0;
    if (!this.initialized) {
      this.prevTP = tp;
      this.initialized = true;
      return this.setValue(50); // neutral
    }
    const rawMF = tp * volume;
    const flow = tp > this.prevTP ? rawMF : tp < this.prevTP ? -rawMF : 0;
    this.prevTP = tp;

    // Evict the oldest when the buffer is full
    if (this.count >= periods) {
      const evicted = this.flows[this.head];
      if (evicted > 0) this.positiveSum -= evicted;
      else if (evicted < 0) this.negativeSum -= -evicted;
      this.flows[this.head] = flow;
      this.head = (this.head + 1) % periods;
    } else {
      this.flows[this.count] = flow;
      this.count++;
    }

    if (flow > 0) this.positiveSum += flow;
    else if (flow < 0) this.negativeSum += -flow;

    let mfi: number;
    if (this.negativeSum === 0) {
      mfi = 100;
    } else if (this.positiveSum === 0) {
      mfi = 0;
    } else {
      mfi = 100.0 - 100.0 / (1.0 + this.positiveSum / this.negativeSum);
    }
    return this.setValue(mfi);
  }

  override update(newValue: number): number {
    return this.updateHLCV(newValue, newValue, newValue, 0);
  }
}
