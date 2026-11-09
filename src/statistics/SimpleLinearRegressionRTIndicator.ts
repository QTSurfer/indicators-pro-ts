import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator } from "@qtsurfer/indicators";
import { copyWindow, isFlat, mean } from "./WindowMath";

/** Σ(i - mean_i)² for a window of `n` values. */
function sxx(n: number): number {
  return (n * (n * n - 1)) / 12.0;
}

/**
 * Full rolling OLS regression: the least-squares line through the last `periods` values, at the positions
 * 0, 1, ... n-1. The value is the slope; the intercept, R squared, the standard error of the estimate and
 * a forecast come with it. Worked out from the window on every tick.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.SimpleLinearRegressionRTIndicator
 */
export class SimpleLinearRegressionRTIndicator extends AbstractWindowSeriesRTIndicator {
  private readonly scratch: Float64Array;
  private _mean = 0;
  private sxy = 0;
  private syy = 0;

  constructor(periods: number) {
    super(periods);
    if (periods < 2) {
      throw new RangeError(`periods must be >= 2, got ${periods}`);
    }
    this.scratch = new Float64Array(periods);
  }

  protected override onReset(): void {
    this._mean = 0;
    this.sxy = 0;
    this.syy = 0;
  }

  /** The slope (same as `getValue()`). */
  getSlope(): number {
    return this.getValue();
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

  /**
   * The coefficient of determination (R squared): how well the linear fit explains the variance in y.
   * 0 when the window has fewer than 2 values or y is constant.
   */
  getRSquared(): number {
    const n = this.windowSize();
    if (n < 2) return 0;
    if (this.syy <= 0) return 0;
    const r2 = (this.sxy * this.sxy) / (sxx(n) * this.syy);
    return Math.min(1.0, Math.max(0.0, r2));
  }

  /** The standard error of the estimate: `sqrt(SSres / (n - 2))`. 0 when the window has fewer than 3 values. */
  getStandardError(): number {
    const n = this.windowSize();
    if (n < 3) return 0;
    const ssReg = (this.sxy * this.sxy) / sxx(n);
    const ssRes = this.syy - ssReg;
    if (ssRes <= 0) return 0;
    return Math.sqrt(ssRes / (n - 2));
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
      this.sxy = 0;
      this.syy = 0;
      return this.setValue(0);
    }
    const meanX = (n - 1) / 2.0;
    let products = 0;
    let squares = 0;
    for (let i = 0; i < n; i++) {
      const deviation = this.scratch[i] - this._mean;
      products += (i - meanX) * deviation;
      squares += deviation * deviation;
    }
    this.sxy = products;
    this.syy = squares;
    return this.setValue(this.sxy / sxx(n));
  }
}
