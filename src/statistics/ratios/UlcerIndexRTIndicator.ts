import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Rolling Ulcer index (Peter Martin, 1987): the root of the mean of the squared drawdowns of the price in a
 * window, `sqrt(mean(((peak - price) / peak * 100)²))`. Unlike the standard deviation it looks only at the
 * falls, by depth and by duration. The window cannot keep its peak incrementally, because evicting the oldest
 * price may remove it, so it is walked again on every tick. 0 until the window holds 2 prices.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.UlcerIndexRTIndicator
 */
export class UlcerIndexRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly buffer: Float64Array;
  private writePos = 0;
  private count = 0;

  constructor(periods: number) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.buffer = new Float64Array(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.count >= this._periods;
  }

  /** The largest drawdown, in percent, in the current window. */
  getMaxDrawdownPercent(): number {
    const n = Math.min(this.count, this._periods);
    if (n < 2) return 0;
    const start = (this.writePos - n + this._periods) % this._periods;
    let peak = 0;
    let maxDD = 0;
    for (let i = 0; i < n; i++) {
      const price = this.buffer[(start + i) % this._periods];
      if (price > peak) peak = price;
      const dd = ((peak - price) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }

  override reset(): void {
    super.reset();
    this.writePos = 0;
    this.count = 0;
  }

  override update(price: number): number {
    if (AbstractRTIndicator.isPoison(price)) {
      return this.getValue();
    }
    this.buffer[this.writePos % this._periods] = price;
    this.writePos++;
    this.count++;

    const n = Math.min(this.count, this._periods);
    if (n < 2) {
      return this.setValue(0);
    }

    const start = (this.writePos - n + this._periods) % this._periods;
    let peak = 0;
    let sumDDSq = 0;

    for (let i = 0; i < n; i++) {
      const p = this.buffer[(start + i) % this._periods];
      if (p > peak) peak = p;
      const dd = ((peak - p) / peak) * 100;
      sumDDSq += dd * dd;
    }

    return this.setValue(Math.sqrt(sumDDSq / n));
  }
}
