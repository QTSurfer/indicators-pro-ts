import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Kaufman Efficiency Ratio: how much of the movement of the price over a window was a move in one direction,
 *
 * ```
 * direction  = |price - price[periods]|
 * volatility = sum(|price[i] - price[i-1]|, periods)
 * ER         = direction / volatility
 * ```
 *
 * From 0 (pure noise) to 1 (a perfect trend); 10 periods when no argument is given. A price that is not finite (NaN or
 * an infinity) is left out: nothing is updated, the last value is returned and `getDirection` and `getVolatility` keep
 * their last values. So is a finite price whose distance from the previous one overflows (a price near the largest
 * double); the previous price stays the reference. The constructor throws a `RangeError` for `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.EfficiencyRatioRTIndicator
 */
export class EfficiencyRatioRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly window: WindowSeriesStore;
  private volatilitySum = 0;
  private direction = 0;
  private volatility = 0;
  private count = 0;

  constructor(periods: number = 10) {
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

  /** The distance of the last price from the one `periods` ticks before, as of the last update. */
  getDirection(): number {
    return this.direction;
  }

  /** The sum of the distances between consecutive prices of the window, as of the last update. */
  getVolatility(): number {
    return this.volatility;
  }

  override isReady(): boolean {
    return this.count > this._periods;
  }

  override reset(): void {
    super.reset();
    this.window.clear();
    this.volatilitySum = 0;
    this.direction = 0;
    this.volatility = 0;
    this.count = 0;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    if (this.count > 0 && AbstractRTIndicator.isPoison(newValue - this.window.getValue(this.window.size - 1))) {
      // Only reachable when the distance overflows (a price near the largest double): hold, and keep the previous
      // price as the reference.
      return this.getValue();
    }
    this.count++;

    if (this.count === 1) {
      this.window.add(newValue);
      return this.setValue(0);
    }

    const prevClose = this.window.getValue(this.window.size - 1);
    const absDiff = Math.abs(newValue - prevClose);

    // Add to the volatility sum
    this.volatilitySum += absDiff;

    // When the window is about to roll, work the sum out again from the window, so it does not drift
    if (this.window.size === this.window.windowSize) {
      this.window.add(newValue);
      this.volatilitySum = 0;
      for (let i = 1; i < this.window.size; i++) {
        this.volatilitySum += Math.abs(this.window.getValue(i) - this.window.getValue(i - 1));
      }
    } else {
      this.window.add(newValue);
    }

    if (this.count <= this._periods) {
      return this.setValue(0);
    }

    this.direction = Math.abs(newValue - this.window.getValue(0));
    this.volatility = this.volatilitySum;

    const er = this.volatility === 0 ? 0 : this.direction / this.volatility;
    return this.setValue(er);
  }
}
