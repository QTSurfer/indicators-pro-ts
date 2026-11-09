import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator } from "@qtsurfer/indicators";
import { copyWindow, isFlat, mean } from "./WindowMath";

/**
 * Rolling sample skewness over a window: how asymmetric the values are. Positive means a right tail,
 * negative a left tail. Worked out from the window on every tick, with the adjusted-sample formula;
 * 0 while the window holds fewer than 3 values or all the same one.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.SkewnessRTIndicator
 */
export class SkewnessRTIndicator extends AbstractWindowSeriesRTIndicator {
  private readonly scratch: Float64Array;
  private _mean = 0;

  constructor(periods: number) {
    super(periods);
    if (periods < 3) {
      throw new RangeError(`Periods must be >= 3, got: ${periods}`);
    }
    this.scratch = new Float64Array(periods);
  }

  protected override onReset(): void {
    this._mean = 0;
  }

  /** The mean of the window after the last update. */
  getMean(): number {
    return this._mean;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    this.window().add(newValue);
    const n = copyWindow(this.window(), this.scratch);
    const flat = isFlat(this.scratch, n);
    this._mean = flat ? this.scratch[0] : mean(this.scratch, n);
    if (n < 3 || flat) {
      return this.setValue(0);
    }
    let squares = 0;
    let cubes = 0;
    for (let i = 0; i < n; i++) {
      const deviation = this.scratch[i] - this._mean;
      const square = deviation * deviation;
      squares += square;
      cubes += square * deviation;
    }
    const m2 = squares / n;
    const m3 = cubes / n;
    const skew = (n * n * m3) / ((n - 1) * (n - 2) * m2 * Math.sqrt(m2));
    return this.setValue(skew);
  }
}
