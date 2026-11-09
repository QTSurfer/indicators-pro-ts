import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator } from "@qtsurfer/indicators";

const DEFAULT_OFFSET_FACTOR = 0.85;
const DEFAULT_SIGMA_FACTOR = 6.0;

/**
 * Arnaud Legoux moving average (ALMA): a Gaussian-weighted average of the last `periods` values that balances
 * smoothness and responsiveness. The window is indexed from the oldest value (0) to the newest (`periods - 1`),
 * and the weights are worked out once, in the constructor:
 *
 * ```
 * offset = floor(offsetFactor * (periods - 1))      sigma = periods / sigmaFactor
 * w[i]   = exp(-((i - offset)^2) / (2 * sigma^2))
 * ALMA   = sum(w[i] * price[i]) / sum(w[i])
 * ```
 *
 * With the defaults (offset factor 0.85, sigma factor 6) the peak of the Gaussian sits near the newest value, which
 * gives ALMA its low lag. Until the window is full, the values that are there take the first weights and are divided
 * by the sum of those weights. A tick costs `periods` multiplications. A value that is not finite is not left out, as
 * in the Java class: it goes into the window like any other.
 * Port of com.wualabs.qtsurfer.engine.indicators.averages.pro.AlmaRTIndicator
 */
export class AlmaRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly window: WindowSeriesStore;
  private readonly weights: Float64Array;
  private readonly weightSum: number;

  constructor(periods: number);
  constructor(periods: number, offsetFactor: number, sigmaFactor: number);
  constructor(periods: number, offsetFactor = DEFAULT_OFFSET_FACTOR, sigmaFactor = DEFAULT_SIGMA_FACTOR) {
    super();
    this._periods = periods;
    this.window = new WindowSeriesStore(periods);

    this.weights = new Float64Array(periods);
    const offset = Math.floor(offsetFactor * (periods - 1));
    const sigma = periods / sigmaFactor;
    const twoSigmaSq = 2.0 * sigma * sigma;

    let sum = 0;
    for (let i = 0; i < periods; i++) {
      const diff = i - offset;
      this.weights[i] = Math.exp(-(diff * diff) / twoSigmaSq);
      sum += this.weights[i];
    }
    this.weightSum = sum;
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.window.size >= this._periods;
  }

  override reset(): void {
    super.reset();
    this.window.clear();
  }

  override update(newValue: number): number {
    this.window.add(newValue);
    const size = this.window.size;

    if (size < this._periods) {
      // Both the weights and the window run from the oldest value to the newest: they pair directly.
      let wSum = 0;
      let vSum = 0;
      for (let i = 0; i < size; i++) {
        const w = this.weights[i];
        vSum += w * this.window.getValue(i);
        wSum += w;
      }
      return this.setValue(wSum !== 0 ? vSum / wSum : 0);
    }

    let vSum = 0;
    for (let i = 0; i < this._periods; i++) {
      vSum += this.weights[i] * this.window.getValue(i);
    }
    return this.setValue(vSum / this.weightSum);
  }
}
