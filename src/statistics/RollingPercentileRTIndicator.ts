import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Rolling percentile over a window, by sorted insertion: a circular buffer keeps the arrival order and a
 * sorted array the ranks. The value is read with linear interpolation between adjacent ranks (as Excel's
 * PERCENTILE.INC); the percentile is in [0, 1], 0.5 the median. 0 until the window holds a value.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.RollingPercentileRTIndicator
 */
export class RollingPercentileRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly percentile: number;
  private readonly buffer: Float64Array; // circular buffer (insertion order)
  private readonly sorted: Float64Array; // sorted values
  private writePos = 0;
  private count = 0;

  constructor(periods: number, percentile: number) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    if (percentile < 0 || percentile > 1) {
      throw new RangeError(`Percentile must be in [0, 1], got: ${percentile}`);
    }
    this._periods = periods;
    this.percentile = percentile;
    this.buffer = new Float64Array(periods);
    this.sorted = new Float64Array(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.count >= this._periods;
  }

  getPercentile(): number {
    return this.percentile;
  }

  /** The median of the current window. */
  getMedian(): number {
    if (this.count === 0) return 0;
    const n = Math.min(this.count, this._periods);
    if (n % 2 === 1) {
      return this.sorted[Math.trunc(n / 2)];
    }
    return (this.sorted[Math.trunc(n / 2) - 1] + this.sorted[Math.trunc(n / 2)]) / 2.0;
  }

  /** The minimum value in the current window. */
  getMin(): number {
    return this.count === 0 ? 0 : this.sorted[0];
  }

  /** The maximum value in the current window. */
  getMax(): number {
    return this.count === 0 ? 0 : this.sorted[Math.min(this.count, this._periods) - 1];
  }

  override reset(): void {
    super.reset();
    this.writePos = 0;
    this.count = 0;
  }

  override update(value: number): number {
    if (AbstractRTIndicator.isPoison(value)) {
      return this.getValue();
    }
    let n = Math.min(this.count, this._periods);

    // Evict oldest if window full
    if (this.count >= this._periods) {
      const evicted = this.buffer[this.writePos % this._periods];
      this.removeFromSorted(evicted, n);
      n--;
    }

    // Add new value
    this.buffer[this.writePos % this._periods] = value;
    this.writePos++;
    this.count++;
    this.insertIntoSorted(value, n);
    n++;

    return this.setValue(this.computePercentile(n));
  }

  private computePercentile(n: number): number {
    if (n === 0) return 0;
    if (n === 1) return this.sorted[0];

    const rank = this.percentile * (n - 1);
    const lower = Math.trunc(rank);
    const upper = lower + 1;
    if (upper >= n) return this.sorted[n - 1];

    const frac = rank - lower;
    return this.sorted[lower] + frac * (this.sorted[upper] - this.sorted[lower]);
  }

  private insertIntoSorted(value: number, n: number): void {
    // Binary search for insertion point
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sorted[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    // Shift right
    this.sorted.copyWithin(lo + 1, lo, n);
    this.sorted[lo] = value;
  }

  private removeFromSorted(value: number, n: number): void {
    // Binary search for value
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sorted[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    // Shift left
    this.sorted.copyWithin(lo, lo + 1, n);
  }
}
