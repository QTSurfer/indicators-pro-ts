import { AbstractRTIndicator } from "@qtsurfer/indicators";
import { VarianceRTIndicator } from "./VarianceRTIndicator";

/**
 * Rolling Z-Score: how many standard deviations a value is from the mean of the window,
 * `z = (value - mean) / stddev`, from the population variance. 0 when the standard deviation is zero.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.ZScoreRTIndicator
 */
export class ZScoreRTIndicator extends AbstractRTIndicator {
  private readonly variance: VarianceRTIndicator;

  constructor(periods: number) {
    super();
    this.variance = new VarianceRTIndicator(periods);
  }

  get periods(): number {
    return this.variance.periods;
  }

  /** The mean of the window after the last update. */
  getMean(): number {
    return this.variance.getMean();
  }

  /** The standard deviation of the window after the last update. */
  getStdDev(): number {
    const v = this.variance.getValue();
    return v === 0 ? 0 : Math.sqrt(v);
  }

  override isReady(): boolean {
    return this.variance.isReady();
  }

  override reset(): void {
    super.reset();
    this.variance.reset();
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    const v = this.variance.update(newValue);
    if (v === 0) {
      return this.setValue(0);
    }
    const stddev = Math.sqrt(v);
    const mean = this.variance.getMean();
    return this.setValue((newValue - mean) / stddev);
  }
}
