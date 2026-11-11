import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator } from "@qtsurfer/indicators";
import { copyWindow, isFlat, mean } from "./WindowMath";

/**
 * Rolling linear regression slope: the least-squares line through the last `periods` values, at the
 * positions 0, 1, ... n-1, gives the rate of change per tick. Worked out from the window on every tick;
 * the intercept, the mean and a forecast come with it.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.LinearRegressionSlopeRTIndicator
 */
export class LinearRegressionSlopeRTIndicator extends AbstractWindowSeriesRTIndicator {
  private readonly scratch: Float64Array;
  private _mean = 0;

  constructor(periods: number) {
    super(checkPeriods(periods));
    this.scratch = new Float64Array(periods);
  }

  protected override onReset(): void {
    this._mean = 0;
  }

  /** The current rolling mean of the y values, as of the last update. */
  getMean(): number {
    return this._mean;
  }

  /** The y-intercept: `meanY - slope * meanX`. */
  getIntercept(): number {
    const n = this.windowSize();
    if (n < 2) return 0;
    const meanX = (n - 1) / 2.0;
    return this.getMean() - this.getValue() * meanX;
  }

  /** Projects the regression line forward: `intercept + slope * (n - 1 + ahead)`. */
  forecast(ahead: number): number {
    const n = this.windowSize();
    if (n < 2) return 0;
    return this.getIntercept() + this.getValue() * (n - 1 + ahead);
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    this.window().add(newValue);
    const n = copyWindow(this.window(), this.scratch);
    const flat = isFlat(this.scratch, n);
    this._mean = flat ? this.scratch[0] : mean(this.scratch, n);
    if (n < 2 || flat) {
      return this.setValue(0);
    }
    const meanX = (n - 1) / 2.0;
    let sxy = 0;
    for (let i = 0; i < n; i++) {
      sxy += (i - meanX) * (this.scratch[i] - this._mean);
    }
    const sxx = (n * (n * n - 1)) / 12.0;
    return this.setValue(sxy / sxx);
  }
}

/** Runs before the window is created, which would fail with its own text. The Java text is kept as it is: lower case, no colon. */
function checkPeriods(periods: number): number {
  if (periods < 2) {
    throw new RangeError(`periods must be >= 2, got ${periods}`);
  }
  return periods;
}
