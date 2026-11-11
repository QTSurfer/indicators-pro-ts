import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator } from "@qtsurfer/indicators";

const DEFAULT_PERIOD = 10;
const ALPHA = 0.33;
const CLAMP = 0.999;

/**
 * Fisher transform: turns the price into a Gaussian-like variable to give sharper turning points,
 *
 * ```
 * normalized = 2 * (price - min) / (max - min) - 1      (kept in [-0.999, 0.999])
 * smoothed   = alpha * normalized + (1 - alpha) * prevSmoothed      (alpha = 0.33)
 * fisher     = 0.5 * ln((1 + smoothed) / (1 - smoothed))
 * ```
 *
 * The minimum and maximum come from the last `periods` prices, found with a pass over the window on every tick. The
 * first smoothed value is the first normalized one. The normalized value is 0 while the window is flat. 10 periods
 * when no argument is given. A value that is not finite (NaN or an infinity) is left out: nothing is updated and the
 * last value is returned. The constructor throws a `RangeError` for `periods` below 2: the range of a single price is
 * always 0.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.FisherTransformRTIndicator
 */
export class FisherTransformRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly window: WindowSeriesStore;
  private smoothed = 0;
  private initialized = false;

  constructor(periods = DEFAULT_PERIOD) {
    super();
    if (periods < 2) {
      throw new RangeError(`Periods must be >= 2, got: ${periods}`);
    }
    this._periods = periods;
    this.window = new WindowSeriesStore(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.window.size >= this._periods;
  }

  override reset(): void {
    super.reset();
    this.window.clear();
    this.smoothed = 0;
    this.initialized = false;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    this.window.add(newValue);

    const size = this.window.size;
    let max = Number.NEGATIVE_INFINITY;
    let min = Number.POSITIVE_INFINITY;
    for (let i = 0; i < size; i++) {
      const v = this.window.getValue(i);
      if (v > max) max = v;
      if (v < min) min = v;
    }

    const range = max - min;
    let normalized: number;
    if (range !== 0) {
      normalized = (2.0 * (newValue - min)) / range - 1.0;
    } else {
      normalized = 0;
    }

    // Clamp to avoid log(0)
    normalized = Math.max(-CLAMP, Math.min(CLAMP, normalized));
    if (AbstractRTIndicator.isPoison(normalized)) {
      // Only reachable when the window range overflows (|price| near Number.MAX_VALUE): the price is already in the
      // window; smoothed and initialized stay as they were.
      return this.getValue();
    }

    // EMA smoothing
    if (!this.initialized) {
      this.smoothed = normalized;
      this.initialized = true;
    } else {
      this.smoothed = ALPHA * normalized + (1.0 - ALPHA) * this.smoothed;
    }

    // Clamp smoothed value as well
    const clamped = Math.max(-CLAMP, Math.min(CLAMP, this.smoothed));

    const fisher = 0.5 * Math.log((1.0 + clamped) / (1.0 - clamped));
    return this.setValue(fisher);
  }
}
