import { AbstractRTIndicator } from "@qtsurfer/indicators";
import { SimpleLinearRegressionRTIndicator } from "$statistics/SimpleLinearRegressionRTIndicator";

/**
 * Least squares moving average (LSMA, also the linear regression value or end point moving average): the
 * least-squares line through the last `periods` values, taken at the newest position,
 * `intercept + slope * (n - 1)`. A thin wrapper around the simple linear regression. 25 periods when no
 * argument is given. A value that is not finite (NaN or an infinity) is left out: the regression is not updated and the
 * last value is returned. The constructor throws a `RangeError` for `periods` below 2: a line needs two points.
 * Port of com.wualabs.qtsurfer.engine.indicators.averages.pro.LeastSquaresMovingAverageRTIndicator
 */
export class LeastSquaresMovingAverageRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly linReg: SimpleLinearRegressionRTIndicator;

  constructor(periods = 25) {
    super();
    if (periods < 2) {
      throw new RangeError(`Periods must be >= 2, got: ${periods}`);
    }
    this._periods = periods;
    this.linReg = new SimpleLinearRegressionRTIndicator(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.linReg.isReady();
  }

  override reset(): void {
    super.reset();
    this.linReg.reset();
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    this.linReg.update(newValue);
    return this.setValue(this.linReg.forecast(0));
  }
}
