import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator } from "@qtsurfer/indicators";
import { isFlat, mean } from "./WindowMath";
import { minimumPeriods } from "$core/Periods";

/**
 * Rolling sample excess kurtosis over a window: how heavy the tails are. A normal distribution has
 * 0; a positive value means heavy tails. Worked out from the window on every tick, with the
 * adjusted-sample formula; 0 while the window holds fewer than 4 values or all the same one.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.KurtosisRTIndicator
 */
export class KurtosisRTIndicator extends AbstractWindowSeriesRTIndicator {
  private readonly scratch: Float64Array;
  private _mean = 0;

  constructor(periods: number) {
    super(minimumPeriods(periods, 4));
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
    const window = this.window();
    window.add(newValue);
    const n = window.size;
    for (let i = 0; i < n; i++) {
      this.scratch[i] = window.getValue(i);
    }
    const flat = isFlat(this.scratch, n);
    this._mean = flat ? this.scratch[0] : mean(this.scratch, n);
    if (n < 4 || flat) {
      return this.setValue(0);
    }
    let squares = 0;
    let quartics = 0;
    for (let i = 0; i < n; i++) {
      const deviation = this.scratch[i] - this._mean;
      const square = deviation * deviation;
      squares += square;
      quartics += square * square;
    }
    const m2 = squares / n;
    const m4 = quartics / n;
    const n1 = n - 1;
    const n2 = n - 2;
    const n3 = n - 3;
    const kurtosis = ((n + 1) * n1 * m4) / (n2 * n3 * m2 * m2) - (3.0 * n1 * n1) / (n2 * n3);
    return this.setValue(kurtosis);
  }
}
