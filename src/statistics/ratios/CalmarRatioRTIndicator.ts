import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Rolling Calmar ratio: the annualized return of the log returns of the price over a window, divided by the
 * largest drawdown of their cumulative sum inside it. The return is `(sumR / n) * annualizationFactor`
 * (252 by default). The window cannot keep its drawdown incrementally, because evicting the oldest return may
 * remove the peak, so it is worked out again over the window on every tick. 0 while the window holds fewer
 * than 2 returns or has no drawdown.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.CalmarRatioRTIndicator
 */
export class CalmarRatioRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly returns: Float64Array;
  private writePos = 0;
  private sumR = 0;
  private prevPrice = 0;
  private hasPrev = false;
  private count = 0;
  private annualizationFactor = 252.0;

  constructor(periods: number) {
    super();
    if (periods < 2) {
      throw new RangeError(`Periods must be >= 2, got: ${periods}`);
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

  /**
   * Sets the annualization factor for the return component. Default is 252 (daily bars to an annual
   * return). The mean return per period is multiplied by this factor.
   */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The annualized return over the current window. */
  getAnnualizedReturn(): number {
    if (this.count < 1) return 0;
    const n = Math.min(this.count, this._periods);
    return (this.sumR / n) * this.annualizationFactor;
  }

  /** The largest drawdown of the cumulative log return within the current window. */
  getMaxDrawdown(): number {
    return this.computeWindowMaxDrawdown();
  }

  override reset(): void {
    super.reset();
    this.sumR = 0;
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
      return this.setValue(0);
    }

    const logReturn = Math.log(price / this.prevPrice);
    if (AbstractRTIndicator.isPoison(logReturn)) {
      return this.getValue();
    }
    this.prevPrice = price;

    // Evict oldest if window full
    if (this.count >= this._periods) {
      this.sumR -= this.returns[this.writePos % this._periods];
    }

    this.returns[this.writePos % this._periods] = logReturn;
    this.writePos++;
    this.sumR += logReturn;
    this.count++;

    const n = Math.min(this.count, this._periods);
    if (n < 2) {
      return this.setValue(0);
    }

    const maxDD = this.computeWindowMaxDrawdown();
    if (maxDD <= 0) {
      return this.setValue(0);
    }

    const annReturn = (this.sumR / n) * this.annualizationFactor;
    return this.setValue(annReturn / maxDD);
  }

  private computeWindowMaxDrawdown(): number {
    const n = Math.min(this.count, this._periods);
    if (n < 2) return 0;

    const start = (this.writePos - n + this._periods) % this._periods;
    let cumReturn = 0;
    let peak = 0;
    let maxDD = 0;

    for (let i = 0; i < n; i++) {
      cumReturn += this.returns[(start + i) % this._periods];
      if (cumReturn > peak) {
        peak = cumReturn;
      }
      const dd = peak - cumReturn;
      if (dd > maxDD) {
        maxDD = dd;
      }
    }

    return maxDD;
  }
}
