import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Rolling tail ratio of the log returns of the price: the upper percentile over the absolute value of the
 * lower one, `percentile(0.95) / |percentile(0.05)|` by default, so the asymmetry between the gain tail and
 * the loss tail. Above 1 the right tail is fatter, below 1 the left one is. A circular buffer keeps the
 * arrival order and a sorted array the ranks (sorted insertion, so a tick walks the window);
 * `withPercentiles` sets the two percentiles. 0 while the window holds fewer than 2 returns or the lower
 * percentile is 0.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.TailRatioRTIndicator
 */
export class TailRatioRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly buffer: Float64Array; // circular buffer of returns
  private readonly sorted: Float64Array; // sorted returns
  private writePos = 0;
  private count = 0;
  private prevPrice = 0;
  private hasPrev = false;
  private upperPct = 0.95;
  private lowerPct = 0.05;

  constructor(periods: number) {
    super();
    if (periods < 2) {
      throw new RangeError(`Periods must be >= 2, got: ${periods}`);
    }
    this._periods = periods;
    this.buffer = new Float64Array(periods);
    this.sorted = new Float64Array(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.count >= this._periods;
  }

  /** Sets the upper and the lower percentile. Default: 0.95 and 0.05. */
  withPercentiles(upper: number, lower: number): this {
    if (upper <= 0 || upper >= 1 || lower <= 0 || lower >= 1) {
      throw new RangeError("Percentiles must be in (0, 1)");
    }
    this.upperPct = upper;
    this.lowerPct = lower;
    return this;
  }

  /** The upper percentile of the current window. */
  getUpperPercentile(): number {
    const n = Math.min(this.count, this._periods);
    return this.computePercentile(n, this.upperPct);
  }

  /** The lower percentile of the current window. */
  getLowerPercentile(): number {
    const n = Math.min(this.count, this._periods);
    return this.computePercentile(n, this.lowerPct);
  }

  override reset(): void {
    super.reset();
    this.writePos = 0;
    this.count = 0;
    this.prevPrice = 0;
    this.hasPrev = false;
  }

  override update(price: number): number {
    if (!this.hasPrev) {
      if (AbstractRTIndicator.isPoison(price)) {
        return this.getValue();
      }
      this.hasPrev = true;
      this.prevPrice = price;
      return this.setValue(0);
    }

    const logReturn = Math.log(price / this.prevPrice);
    if (AbstractRTIndicator.isPoison(logReturn)) {
      return this.getValue();
    }
    this.prevPrice = price;

    let n = Math.min(this.count, this._periods);

    // Evict oldest if window full
    if (this.count >= this._periods) {
      const evicted = this.buffer[this.writePos % this._periods];
      this.removeFromSorted(evicted, n);
      n--;
    }

    // Add new return
    this.buffer[this.writePos % this._periods] = logReturn;
    this.writePos++;
    this.count++;
    this.insertIntoSorted(logReturn, n);
    n++;

    if (n < 2) {
      return this.setValue(0);
    }

    const upper = this.computePercentile(n, this.upperPct);
    const lower = this.computePercentile(n, this.lowerPct);
    const absLower = Math.abs(lower);

    if (absLower === 0) {
      return this.setValue(0);
    }

    return this.setValue(upper / absLower);
  }

  private computePercentile(n: number, pct: number): number {
    if (n === 0) return 0;
    if (n === 1) return this.sorted[0];

    const rank = pct * (n - 1);
    const lower = Math.trunc(rank);
    const upper = lower + 1;
    if (upper >= n) return this.sorted[n - 1];

    const frac = rank - lower;
    return this.sorted[lower] + frac * (this.sorted[upper] - this.sorted[lower]);
  }

  private insertIntoSorted(value: number, n: number): void {
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sorted[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    this.sorted.copyWithin(lo + 1, lo, n);
    this.sorted[lo] = value;
  }

  private removeFromSorted(value: number, n: number): void {
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sorted[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    this.sorted.copyWithin(lo, lo + 1, n);
  }
}
