import { AbstractRTIndicator } from "@qtsurfer/indicators";
import { SimpleLinearRegressionRTIndicator } from "$statistics/SimpleLinearRegressionRTIndicator";

/**
 * Least squares moving average (LSMA, also the linear regression value or end point moving average): the
 * least-squares line through the last `periods` values, taken at the newest position,
 * `intercept + slope * (n - 1)`. A thin wrapper around the simple linear regression. 25 periods when no
 * argument is given.
 * Port of com.wualabs.qtsurfer.engine.indicators.averages.pro.LeastSquaresMovingAverageRTIndicator
 */
export class LeastSquaresMovingAverageRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly linReg: SimpleLinearRegressionRTIndicator;

  constructor(periods = 25) {
    super();
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
    this.linReg.update(newValue);
    return this.setValue(this.linReg.forecast(0));
  }
}
