import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator } from "@qtsurfer/indicators";

/**
 * Rolling Hurst exponent by rescaled range (R/S) over a window of log returns: below 0.5 the series
 * mean-reverts, at 0.5 it is a random walk, above 0.5 it trends. The range of the cumulative deviations
 * cannot be kept incrementally, so every tick walks the window. 0.5 while the window is not full or the
 * standard deviation is zero.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.HurstExponentRTIndicator
 */
export class HurstExponentRTIndicator extends AbstractWindowSeriesRTIndicator {
  private readonly returns: Float64Array;
  private readonly invLogN: number;
  private writePos = 0;
  private sumR = 0;
  private sumRSq = 0;
  private prevPrice = 0;
  private hasPrev = false;
  private count = 0;

  constructor(periods: number) {
    super(periods);
    if (periods < 4) {
      throw new RangeError(`Periods must be >= 4, got: ${periods}`);
    }
    this.returns = new Float64Array(periods);
    this.invLogN = 1.0 / Math.log(periods);
  }

  protected override onEvict(evicted: number): void {
    this.sumR -= evicted;
    this.sumRSq -= evicted * evicted;
  }

  protected override onReset(): void {
    this.sumR = 0;
    this.sumRSq = 0;
    this.prevPrice = 0;
    this.hasPrev = false;
    this.writePos = 0;
    this.count = 0;
  }

  override update(price: number): number {
    if (!this.hasPrev) {
      if (AbstractRTIndicator.isPoison(price)) {
        return this.getValue();
      }
      this.hasPrev = true;
      this.prevPrice = price;
      return this.setValue(0.5);
    }

    const logReturn = Math.log(price / this.prevPrice);
    if (AbstractRTIndicator.isPoison(logReturn)) {
      return this.getValue();
    }
    this.prevPrice = price;

    this.window().add(logReturn);
    this.returns[this.writePos % this.periods] = logReturn;
    this.writePos++;
    this.sumR += logReturn;
    this.sumRSq += logReturn * logReturn;
    this.count = Math.min(this.count + 1, this.periods);

    if (this.count < this.periods) {
      return this.setValue(0.5);
    }

    const n = this.periods;
    const mean = this.sumR / n;
    const variance = this.sumRSq / n - mean * mean;

    if (variance <= 0) {
      return this.setValue(0.5);
    }

    const stddev = Math.sqrt(variance);

    // Compute range of cumulative deviations from mean
    let cumDev = 0;
    let maxCum = Number.NEGATIVE_INFINITY;
    let minCum = Number.POSITIVE_INFINITY;
    const start = (this.writePos - n + this.periods) % this.periods;
    for (let i = 0; i < n; i++) {
      cumDev += this.returns[(start + i) % this.periods] - mean;
      if (cumDev > maxCum) maxCum = cumDev;
      if (cumDev < minCum) minCum = cumDev;
    }

    const rs = (maxCum - minCum) / stddev;

    if (rs <= 0) {
      return this.setValue(0.5);
    }

    const hurst = Math.log(rs) * this.invLogN;

    return this.setValue(hurst);
  }
}
