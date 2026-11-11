import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Rate of change (ROC): the change of the price over `periods` ticks, in percent,
 *
 * ```
 * ROC = (price - price[n]) / price[n] * 100
 * ```
 *
 * A window of `periods + 1` prices keeps the old one, so a tick costs the same whatever the history. 0 until the
 * window holds more than `periods` prices, and 0 when the old price is 0. 12 periods when no argument is given. A
 * value that is not finite (NaN or an infinity) is left out: nothing is updated and the last value is returned. The
 * constructor throws a `RangeError` for `periods` below 1: a lag of 0 would compare the price with itself.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.RocRTIndicator
 */
export class RocRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly window: WindowSeriesStore;

  constructor(periods = 12) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.window = new WindowSeriesStore(periods + 1);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.window.size > this._periods;
  }

  override reset(): void {
    super.reset();
    this.window.clear();
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    this.window.add(newValue);
    if (this.window.size <= this._periods) {
      return this.setValue(0);
    }
    const oldest = this.window.getValue(0);
    return this.setValue(oldest !== 0 ? ((newValue - oldest) / oldest) * 100 : 0);
  }
}
