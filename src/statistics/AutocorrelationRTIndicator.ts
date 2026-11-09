import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Rolling lag-1 autocorrelation of log returns: the Pearson correlation between each return and the one
 * before it, over a window. Positive means momentum, negative mean-reversion, near zero a random walk.
 * Kept with running sums over the pairs, so a tick costs the same whatever the window; 0 while fewer than 3
 * pairs exist or either side has no variance.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.AutocorrelationRTIndicator
 */
export class AutocorrelationRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly returns: Float64Array;
  private writePos = 0;
  private count = 0;
  private prevPrice = 0;
  private hasPrev = false;

  // Pair accumulators: over (r_i, r_{i-1}) pairs
  private sumX = 0; // sum of r_i (current in pair)
  private sumY = 0; // sum of r_{i-1} (lag in pair)
  private sumXY = 0; // sum of r_i * r_{i-1}
  private sumXSq = 0; // sum of r_i squared
  private sumYSq = 0; // sum of r_{i-1} squared
  private nPairs = 0;

  constructor(periods: number) {
    super();
    if (periods < 4) {
      throw new RangeError(`Periods must be >= 4, got: ${periods}`);
    }
    this._periods = periods;
    this.returns = new Float64Array(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.count >= this._periods;
  }

  /** The number of pairs in the current window. */
  getPairCount(): number {
    return this.nPairs;
  }

  override reset(): void {
    super.reset();
    this.writePos = 0;
    this.count = 0;
    this.prevPrice = 0;
    this.hasPrev = false;
    this.sumX = 0;
    this.sumY = 0;
    this.sumXY = 0;
    this.sumXSq = 0;
    this.sumYSq = 0;
    this.nPairs = 0;
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

    // Before adding, check if window is full and we need to evict
    if (this.count >= this._periods) {
      // Evict oldest return and destroy its pair
      const oldestIdx = this.writePos % this._periods;
      const secondIdx = (this.writePos + 1) % this._periods;
      const rOldest = this.returns[oldestIdx]; // r_0 (Y in the pair)
      const rSecond = this.returns[secondIdx]; // r_1 (X in the pair)

      // Remove pair (rSecond, rOldest) from accumulators
      this.sumX -= rSecond;
      this.sumY -= rOldest;
      this.sumXY -= rSecond * rOldest;
      this.sumXSq -= rSecond * rSecond;
      this.sumYSq -= rOldest * rOldest;
      this.nPairs--;
    }

    // Add new return
    const prevIdx = (this.writePos - 1 + this._periods) % this._periods;
    const hasPrevReturn = this.count > 0;

    this.returns[this.writePos % this._periods] = logReturn;
    this.writePos = (this.writePos + 1) % this._periods;
    this.count++;

    // Add new pair (logReturn, prevReturn) if we have a previous return
    if (hasPrevReturn) {
      const prevReturn = this.returns[prevIdx];
      this.sumX += logReturn;
      this.sumY += prevReturn;
      this.sumXY += logReturn * prevReturn;
      this.sumXSq += logReturn * logReturn;
      this.sumYSq += prevReturn * prevReturn;
      this.nPairs++;
    }

    if (this.nPairs < 3) {
      return this.setValue(0);
    }

    // Pearson correlation over pairs
    const meanX = this.sumX / this.nPairs;
    const meanY = this.sumY / this.nPairs;
    const varX = this.sumXSq / this.nPairs - meanX * meanX;
    const varY = this.sumYSq / this.nPairs - meanY * meanY;

    if (varX <= 0 || varY <= 0) {
      return this.setValue(0);
    }

    const cov = this.sumXY / this.nPairs - meanX * meanY;
    let r = cov / Math.sqrt(varX * varY);

    // Clamp for FP safety
    if (r > 1) r = 1;
    if (r < -1) r = -1;

    return this.setValue(r);
  }
}
