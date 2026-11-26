import { AbstractRTIndicator, EmaRTIndicator } from "@qtsurfer/indicators";

/**
 * Double exponential moving average (DEMA): `2 * EMA(value) - EMA(EMA(value))`. Smoothing twice and subtracting
 * the second from twice the first takes out most of the lag of a plain EMA. Two EMAs of the same period keep
 * the state, so a tick costs the same whatever the history. A value that is not finite (NaN or an infinity) is left
 * out: neither average is updated and the last value is returned. The constructor throws a `RangeError` for `periods`
 * below 1.
 *
 * The second average needs `periods` values of the first, so the indicator is ready at update `2 * (periods - 1) + 1`:
 * the look-back of the same indicator in TA-Lib. The averages start from the first value they see, so at that update
 * that first value still weighs about 11% of the result; it weighs under 1% from update `3.2 * periods` on. The updates
 * that count are the finite ones.
 * Port of com.wualabs.qtsurfer.engine.indicators.averages.pro.DemaRTIndicator
 */
export class DemaRTIndicator extends AbstractRTIndicator {
  private readonly ema1: EmaRTIndicator;
  private readonly ema2: EmaRTIndicator;
  private readonly warmUp: number;
  private updates = 0;

  constructor(periods: number) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this.ema1 = new EmaRTIndicator(periods);
    this.ema2 = new EmaRTIndicator(periods);
    this.warmUp = 2 * (periods - 1) + 1;
  }

  override isReady(): boolean {
    return this.updates >= this.warmUp;
  }

  override reset(): void {
    super.reset();
    this.ema1.reset();
    this.ema2.reset();
    this.updates = 0;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    if (this.updates < this.warmUp) {
      this.updates++;
    }
    const e1 = this.ema1.update(newValue);
    const e2 = this.ema2.update(e1);
    return this.setValue(2 * e1 - e2);
  }
}
