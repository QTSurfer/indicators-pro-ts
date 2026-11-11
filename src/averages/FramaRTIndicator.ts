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
 * and a smooth one. An odd number of periods is made even by adding one (3 becomes 4). Until the window is full the
 * value is the price itself. 20 periods when no argument is given. A value that is not finite (NaN or an infinity) is
 * left out: nothing is updated, the last value is returned and the fractal dimension and the alpha keep their last
 * values. The constructor throws a `RangeError` for `periods` below 3: with 2 each half holds one value, and the fractal
 * dimension would be undefined on every tick.
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
    if (periods < 3) {
      throw new RangeError(`Periods must be >= 3, got: ${periods}`);
    }
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
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
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
    let dimension: number;
    if (sum > 0 && n3 > 0) {
      dimension = (Math.log(sum) - Math.log(n3)) / Math.log(2);
    } else {
      dimension = 1.0;
    }

    let nextAlpha = Math.exp(-4.6 * (dimension - 1.0));
    nextAlpha = Math.max(ALPHA_MIN, Math.min(ALPHA_MAX, nextAlpha));

    const next = nextAlpha * newValue + (1.0 - nextAlpha) * this.frama;
    if (AbstractRTIndicator.isPoison(next)) {
      // Only reachable when the window ranges overflow (|price| near Number.MAX_VALUE): the price is already in the
      // window and counted; frama, fractalDimension and alpha stay as they were.
      return this.getValue();
    }
    this.fractalDimension = dimension;
    this.alpha = nextAlpha;
    this.frama = next;
    return this.setValue(this.frama);
  }
}
