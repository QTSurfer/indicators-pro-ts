import { AbstractRTIndicator, StandardDeviationRTIndicator } from "@qtsurfer/indicators";

/**
 * Relative Volatility Index: the RSI applied to the standard deviation of the price and not to the price,
 *
 * ```
 * stddev   = StdDev(price, stdPeriod)
 * change   = stddev - prevStddev
 * upMove   = max(change, 0)
 * downMove = max(-change, 0)
 * avgUp    = WilderSmooth(upMove, rsiPeriod)
 * avgDown  = WilderSmooth(downMove, rsiPeriod)
 * RVI      = 100 * avgUp / (avgUp + avgDown)
 * ```
 *
 * From 0 to 100: above 50 the volatility rises, below 50 it falls. 10 and 14 periods by default. A price that is not
 * finite (NaN or an infinity) is left out: nothing is updated and the last value is returned. So is a price whose
 * standard deviation is not finite, which takes a price near the largest double: the window has taken the price; the
 * counter, the previous deviation and both averages stay as they were. The constructor throws a `RangeError` for a
 * `stdPeriod` below 2 (the standard deviation of one price is always 0) and for an `rsiPeriod` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.volatility.pro.RelativeVolatilityIndexRTIndicator
 */
export class RelativeVolatilityIndexRTIndicator extends AbstractRTIndicator {
  private readonly _stdPeriod: number;
  private readonly _rsiPeriod: number;
  private readonly stdDev: StandardDeviationRTIndicator;
  private prevStdDev = 0;
  private avgUp = 0;
  private avgDown = 0;
  private count = 0;
  private stdDevInitialized = false;

  constructor();
  constructor(stdPeriod: number, rsiPeriod: number);
  constructor(stdPeriod: number = 10, rsiPeriod: number = 14) {
    super();
    if (stdPeriod < 2) {
      throw new RangeError(`StdPeriod must be >= 2, got: ${stdPeriod}`);
    }
    if (rsiPeriod < 1) {
      throw new RangeError(`RsiPeriod must be >= 1, got: ${rsiPeriod}`);
    }
    this._stdPeriod = stdPeriod;
    this._rsiPeriod = rsiPeriod;
    this.stdDev = new StandardDeviationRTIndicator(stdPeriod);
  }

  getStdPeriod(): number {
    return this._stdPeriod;
  }

  getRsiPeriod(): number {
    return this._rsiPeriod;
  }

  override isReady(): boolean {
    return this.count > this._stdPeriod + this._rsiPeriod;
  }

  override reset(): void {
    super.reset();
    this.stdDev.reset();
    this.prevStdDev = 0;
    this.avgUp = 0;
    this.avgDown = 0;
    this.count = 0;
    this.stdDevInitialized = false;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    const stdPeriod = this._stdPeriod;
    const rsiPeriod = this._rsiPeriod;
    const currentStdDev = this.stdDev.update(newValue);
    if (AbstractRTIndicator.isPoison(currentStdDev)) {
      // Only reachable when the variance overflows (a price near the largest double): the window has taken the price;
      // the counter, the previous deviation and both averages stay as they were.
      return this.getValue();
    }
    this.count++;

    if (!this.stdDevInitialized) {
      this.prevStdDev = currentStdDev;
      this.stdDevInitialized = true;
      return this.setValue(50);
    }

    const change = currentStdDev - this.prevStdDev;
    this.prevStdDev = currentStdDev;

    const upMove = Math.max(change, 0);
    const downMove = Math.max(-change, 0);

    // Wilder smoothing: avg = (avg * (period - 1) + newVal) / period
    if (this.count <= stdPeriod + 1) {
      // Accumulate the initial sums
      this.avgUp += upMove;
      this.avgDown += downMove;
      return this.setValue(50);
    }

    if (this.count === stdPeriod + 2) {
      // First Wilder average: the simple average of the accumulated values
      this.avgUp = (this.avgUp + upMove) / (this.count - stdPeriod);
      this.avgDown = (this.avgDown + downMove) / (this.count - stdPeriod);
    } else {
      this.avgUp = (this.avgUp * (rsiPeriod - 1) + upMove) / rsiPeriod;
      this.avgDown = (this.avgDown * (rsiPeriod - 1) + downMove) / rsiPeriod;
    }

    const denom = this.avgUp + this.avgDown;
    if (denom === 0) {
      return this.setValue(50);
    }
    return this.setValue((100.0 * this.avgUp) / denom);
  }
}
