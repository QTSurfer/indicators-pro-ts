import { AbstractRTIndicator } from "@qtsurfer/indicators";
import { LeastSquaresMovingAverageRTIndicator } from "$averages/LeastSquaresMovingAverageRTIndicator";

/**
 * Chande forecast oscillator (CFO): the percentage deviation of the price from its least-squares forecast,
 *
 * ```
 * CFO = 100 * (price - LSMA(price, periods)) / price
 * ```
 *
 * Positive when the price is above the trend, negative when below; it usually stays between -5 and +5. The
 * least squares moving average does the work, so the cost of a tick is the one of that average. 0 until that
 * average is ready, and 0 when the price is 0. `getLsmaValue` gives the average of the last update. 14 periods
 * when no argument is given. A value that is not finite (NaN or an infinity) is left out: the average is not
 * updated, the last value is returned and `getLsmaValue` keeps its last value. The constructor throws a `RangeError`
 * for `periods` below 2: a line needs two points.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.ChandeForecastOscillatorRTIndicator
 */
export class ChandeForecastOscillatorRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly lsma: LeastSquaresMovingAverageRTIndicator;
  private lsmaValue = 0;

  constructor(periods = 14) {
    super();
    if (periods < 2) {
      throw new RangeError(`Periods must be >= 2, got: ${periods}`);
    }
    this._periods = periods;
    this.lsma = new LeastSquaresMovingAverageRTIndicator(periods);
  }

  get periods(): number {
    return this._periods;
  }

  /** The least squares moving average of the last update. */
  getLsmaValue(): number {
    return this.lsmaValue;
  }

  override isReady(): boolean {
    return this.lsma.isReady();
  }

  override reset(): void {
    super.reset();
    this.lsma.reset();
    this.lsmaValue = 0;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    this.lsmaValue = this.lsma.update(newValue);

    if (!this.lsma.isReady() || newValue === 0) {
      return this.setValue(0);
    }

    return this.setValue((100.0 * (newValue - this.lsmaValue)) / newValue);
  }
}
