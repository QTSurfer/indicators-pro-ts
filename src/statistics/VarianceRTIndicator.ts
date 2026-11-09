import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator } from "@qtsurfer/indicators";
import { copyWindow, isFlat, mean, sumSquaredDeviations } from "./WindowMath";

/**
 * Rolling variance, worked out from a single window on every tick: the mean first, then the squared
 * deviations from it, oldest value first. Population variance by default; `withSampleVariance(true)`
 * applies Bessel's correction. An internal building block (Z-Score composes it): not exported by the package.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.VarianceRTIndicator
 */
export class VarianceRTIndicator extends AbstractWindowSeriesRTIndicator {
  private readonly scratch: Float64Array;
  private _mean = 0;
  private sampleVariance = false;

  constructor(periods: number) {
    super(periods);
    this.scratch = new Float64Array(periods);
  }

  protected override onReset(): void {
    this._mean = 0;
  }

  /** The mean of the window after the last update. Useful for composing indicators (e.g. Z-Score) without duplicating state. */
  getMean(): number {
    return this._mean;
  }

  withSampleVariance(sampleVariance: boolean): this {
    this.sampleVariance = sampleVariance;
    return this;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    this.window().add(newValue);
    const n = copyWindow(this.window(), this.scratch);
    let variance: number;
    if (isFlat(this.scratch, n)) {
      this._mean = this.scratch[0];
      variance = 0;
    } else {
      this._mean = mean(this.scratch, n);
      variance = sumSquaredDeviations(this.scratch, n, this._mean) / n;
    }
    if (this.sampleVariance && n > 1) {
      variance = (variance * n) / (n - 1);
    }
    return this.setValue(variance);
  }
}
