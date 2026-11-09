import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Detrended price oscillator (DPO): a past price less the simple moving average of `periods` prices,
 *
 * ```
 * DPO = price[n/2 + 1 ticks ago] - SMA(n)
 * ```
 *
 * Comparing a past price with the average takes the trend out and centres the average, so the oscillator shows the
 * cycles. A window of `periods` prices and a running sum keep the state, so a tick costs the same whatever the
 * history. 0 until `periods` prices have come in. 20 periods when no argument is given. A value that is not finite is
 * not left out, as in the Java class: it goes into the window and the sum like any other.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.DetrendedPriceOscillatorRTIndicator
 */
export class DetrendedPriceOscillatorRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly lookback: number; // n/2 + 1
  private readonly priceWindow: WindowSeriesStore;
  private sum = 0;
  private count = 0;

  constructor(periods = 20) {
    super();
    this._periods = periods;
    this.lookback = Math.trunc(periods / 2) + 1;
    this.priceWindow = new WindowSeriesStore(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.count >= this._periods;
  }

  override reset(): void {
    super.reset();
    this.priceWindow.clear();
    this.sum = 0;
    this.count = 0;
  }

  override update(newValue: number): number {
    this.count++;

    // A rolling sum over the last `periods` values
    if (this.priceWindow.size === this._periods) {
      this.sum -= this.priceWindow.getValue(0);
    }
    this.priceWindow.add(newValue);
    this.sum += newValue;

    if (this.count < this._periods) {
      return this.setValue(0);
    }

    const sma = this.sum / this._periods;
    // The window is full and runs from the oldest value (0) to the newest (periods - 1), so the price
    // `lookback` ticks ago is at periods - 1 - lookback.
    const idx = this._periods - 1 - this.lookback;
    if (idx < 0) {
      return this.setValue(0);
    }
    const pastPrice = this.priceWindow.getValue(idx);
    return this.setValue(pastPrice - sma);
  }
}
