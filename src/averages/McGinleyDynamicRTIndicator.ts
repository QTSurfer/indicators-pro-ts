import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * McGinley Dynamic: a self-adjusting moving average that follows the speed of the market,
 *
 * ```
 * MD = MD_prev + (price - MD_prev) / (N * (price / MD_prev)^4)
 * ```
 *
 * It speeds up when the price is far above the average and slows down when it is near, which gives fewer whipsaws than
 * an EMA or an SMA. The first value is the price. A tick costs the same whatever the history. 14 periods when no
 * argument is given. A value that is not finite (NaN or an infinity) is left out: nothing is updated and the last
 * value is returned. The constructor throws a `RangeError` for `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.averages.pro.McGinleyDynamicRTIndicator
 */
export class McGinleyDynamicRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private initialized = false;

  constructor(periods = 14) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.initialized;
  }

  override reset(): void {
    super.reset();
    this.initialized = false;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    if (!this.initialized) {
      this.initialized = true;
      return this.setValue(newValue);
    }
    const md = this.getValue();
    if (md === 0) return this.setValue(newValue);
    const ratio = newValue / md;
    const ratio4 = ratio * ratio * ratio * ratio;
    const denominator = this._periods * ratio4;
    if (denominator === 0) return this.setValue(newValue);
    const next = md + (newValue - md) / denominator;
    if (AbstractRTIndicator.isPoison(next)) {
      // Only reachable when newValue - md overflows (|price| near Number.MAX_VALUE).
      return this.getValue();
    }
    return this.setValue(next);
  }
}
