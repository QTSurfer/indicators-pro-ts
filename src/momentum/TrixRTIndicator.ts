import { AbstractRTIndicator, EmaRTIndicator } from "@qtsurfer/indicators";

/**
 * TRIX (triple exponential average): the rate of change, in percent, of an EMA smoothed three times,
 *
 * ```
 * EMA1 = EMA(price, periods)
 * EMA2 = EMA(EMA1, periods)
 * EMA3 = EMA(EMA2, periods)
 * TRIX = (EMA3 - prevEMA3) / prevEMA3 * 100
 * ```
 *
 * The triple smoothing filters out the small moves of the price; a cross of the zero line is a signal. Three EMAs
 * keep the state, so a tick costs the same whatever the history. 0 on the first price, and 0 while the previous EMA3
 * is 0. 15 periods when no argument is given. A value that is not finite (NaN or an infinity) is left out: no
 * average is updated and the last value is returned. The constructor throws a `RangeError` for `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.TrixRTIndicator
 */
export class TrixRTIndicator extends AbstractRTIndicator {
  private readonly ema1: EmaRTIndicator;
  private readonly ema2: EmaRTIndicator;
  private readonly ema3: EmaRTIndicator;
  private prevEma3 = 0;
  private hasPrev = false;

  constructor(periods = 15) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this.ema1 = new EmaRTIndicator(periods);
    this.ema2 = new EmaRTIndicator(periods);
    this.ema3 = new EmaRTIndicator(periods);
  }

  override isReady(): boolean {
    return this.ema3.isReady() && this.hasPrev;
  }

  override reset(): void {
    super.reset();
    this.ema1.reset();
    this.ema2.reset();
    this.ema3.reset();
    this.prevEma3 = 0;
    this.hasPrev = false;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    const e1 = this.ema1.update(newValue);
    const e2 = this.ema2.update(e1);
    const e3 = this.ema3.update(e2);

    let trix: number;
    if (!this.hasPrev) {
      this.hasPrev = true;
      trix = 0;
    } else {
      trix = this.prevEma3 !== 0 ? ((e3 - this.prevEma3) / this.prevEma3) * 100 : 0;
    }
    this.prevEma3 = e3;
    return this.setValue(trix);
  }
}
