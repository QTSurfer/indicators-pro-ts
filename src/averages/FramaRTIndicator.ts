import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator } from "@qtsurfer/indicators";

const DEFAULT_PERIOD = 20;
const ALPHA_MIN = 0.01;
const ALPHA_MAX = 1.0;

/**
 * Fractal adaptive moving average (FRAMA, John Ehlers): an EMA whose smoothing factor follows the fractal
 * dimension of the price in the window,
 *
 * ```
 * N1 = (max(first half)  - min(first half))  / (N / 2)
 * N2 = (max(second half) - min(second half)) / (N / 2)
 * N3 = (max(window)      - min(window))      / N
 * D     = (ln(N1 + N2) - ln(N3)) / ln(2)
 * alpha = exp(-4.6 * (D - 1)), kept in [0.01, 1.0]
 * FRAMA = alpha * price + (1 - alpha) * previous FRAMA
 * ```
 *
 * A trending price (D near 1) gives a high alpha and a quick average; a noisy one (D near 2) gives a very small alpha
 * and a smooth one. An odd number of periods is made even by adding one. Until the window is full the value is the
 * price itself. 20 periods when no argument is given. A value that is not finite is not left out, as in the Java
 * class: it goes into the window and the average like any other.
 * Port of com.wualabs.qtsurfer.engine.indicators.averages.pro.FramaRTIndicator
 */
export class FramaRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly halfPeriod: number;
  private readonly window: WindowSeriesStore;
  private frama = 0;
  private fractalDimension = 0;
  private alpha = 0;
  private count = 0;

  constructor(periods: number = DEFAULT_PERIOD) {
    super();
    const even = periods % 2 !== 0 ? periods + 1 : periods; // ensure even
    this._periods = even;
    this.halfPeriod = Math.trunc(even / 2);
    this.window = new WindowSeriesStore(even);
  }

  /** The number of periods in use: the one given, plus one when it was odd. */
  get periods(): number {
    return this._periods;
  }

  /** The fractal dimension of the last full window; 0 until the window is full. */
  getFractalDimension(): number {
    return this.fractalDimension;
  }

  /** The smoothing factor of the last full window; 0 until the window is full. */
  getAlpha(): number {
    return this.alpha;
  }

  override isReady(): boolean {
    return this.count >= this._periods;
  }

  override reset(): void {
    super.reset();
    this.window.clear();
    this.frama = 0;
    this.fractalDimension = 0;
    this.alpha = 0;
    this.count = 0;
  }

  override update(newValue: number): number {
    this.window.add(newValue);
    this.count++;

    const size = this.window.size;

    if (this.count === 1) {
      this.frama = newValue;
      return this.setValue(this.frama);
    }

    if (size < this._periods) {
      this.frama = newValue;
      return this.setValue(this.frama);
    }

    // The ranges of the first half, the second half and the full window
    let maxFirst = Number.NEGATIVE_INFINITY;
    let minFirst = Number.POSITIVE_INFINITY;
    let maxSecond = Number.NEGATIVE_INFINITY;
    let minSecond = Number.POSITIVE_INFINITY;
    let maxFull = Number.NEGATIVE_INFINITY;
    let minFull = Number.POSITIVE_INFINITY;

    for (let i = 0; i < this._periods; i++) {
      const v = this.window.getValue(i);
      if (v > maxFull) maxFull = v;
      if (v < minFull) minFull = v;
      if (i < this.halfPeriod) {
        if (v > maxFirst) maxFirst = v;
        if (v < minFirst) minFirst = v;
      } else {
        if (v > maxSecond) maxSecond = v;
        if (v < minSecond) minSecond = v;
      }
    }

    const n1 = (maxFirst - minFirst) / this.halfPeriod;
    const n2 = (maxSecond - minSecond) / this.halfPeriod;
    const n3 = (maxFull - minFull) / this._periods;

    const sum = n1 + n2;
    if (sum > 0 && n3 > 0) {
      this.fractalDimension = (Math.log(sum) - Math.log(n3)) / Math.log(2);
    } else {
      this.fractalDimension = 1.0;
    }

    this.alpha = Math.exp(-4.6 * (this.fractalDimension - 1.0));
    this.alpha = Math.max(ALPHA_MIN, Math.min(ALPHA_MAX, this.alpha));

    this.frama = this.alpha * newValue + (1.0 - this.alpha) * this.frama;
    return this.setValue(this.frama);
  }
}
