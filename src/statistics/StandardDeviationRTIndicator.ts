import { AbstractRTIndicator } from "@qtsurfer/indicators";
import { VarianceRTIndicator } from "./VarianceRTIndicator";

/**
 * Rolling standard deviation: the square root of the variance of the window, worked out from the window itself on
 * every tick (the mean first, then the squared deviations from it, oldest value first). It wraps the pro
 * `VarianceRTIndicator` of this package, so the two share a single window.
 *
 * This is the pro class, not the `StandardDeviationRTIndicator` of `@qtsurfer/indicators`, which has the same simple
 * name. The two differ in their default: the free one gives the sample deviation (Bessel's correction), and this one
 * the population deviation. `withSampleVariance(true)` makes this one give the sample deviation too, the same value
 * as the free one once the window is full, except on a window of identical prices, where this one gives exactly 0 and
 * the free one can leave the root of a tiny rounding residue.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.StandardDeviationRTIndicator
 */
export class StandardDeviationRTIndicator extends AbstractRTIndicator {
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

  /**
   * The variance indicator behind the deviation: its value is the variance of the window after the last update. It is
   * the live instance the deviation updates, not a copy.
   */
  getVariance(): VarianceRTIndicator {
    return this.variance;
  }

  /** Chooses the sample deviation (Bessel's correction) when `true`; the population deviation, the default, when `false`. */
  withSampleVariance(sampleVariance: boolean): this {
    this.variance.withSampleVariance(sampleVariance);
    return this;
  }

  override isReady(): boolean {
    return this.variance.isReady();
  }

  override reset(): void {
    super.reset();
    this.variance.reset();
  }

  override update(newValue: number): number {
    const v = this.variance.update(newValue);
    return this.setValue(v === 0 ? 0 : Math.sqrt(v));
  }
}
