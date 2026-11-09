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
 * when no argument is given. The class does not guard a value that is not finite, as in the Java class: the
 * average leaves such a value out and keeps its last value, but the oscillator takes the value into the
 * quotient, so it gives NaN for it.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.ChandeForecastOscillatorRTIndicator
 */
export class ChandeForecastOscillatorRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly lsma: LeastSquaresMovingAverageRTIndicator;
  private lsmaValue = 0;

  constructor(periods = 14) {
    super();
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
    this.lsmaValue = this.lsma.update(newValue);

    if (!this.lsma.isReady() || newValue === 0) {
      return this.setValue(0);
    }

    return this.setValue((100.0 * (newValue - this.lsmaValue)) / newValue);
  }
}
