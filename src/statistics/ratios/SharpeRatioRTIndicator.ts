import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator } from "@qtsurfer/indicators";

/**
 * Rolling Sharpe ratio of the log returns of the price over a window: `(mean - riskFreeRate) / stddev`. Two
 * running sums (of the returns and of their squares) keep the variance, so a tick costs the same whatever
 * the window. The risk-free rate is per period and 0 by default; `withAnnualizationFactor` multiplies the
 * output (the usual factor is the square root of the periods per year). 0 while the window holds fewer than
 * 2 returns or has no variance.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.SharpeRatioRTIndicator
 */
export class SharpeRatioRTIndicator extends AbstractWindowSeriesRTIndicator {
  private sumR = 0;
  private sumRSq = 0;
  private prevPrice = 0;
  private hasPrev = false;
  private riskFreeRate = 0;
  private annualizationFactor = 1.0;

  constructor(periods: number) {
    super(periods);
    if (periods < 2) {
      throw new RangeError(`Periods must be >= 2, got: ${periods}`);
    }
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
  }

  /**
   * Sets the risk-free rate per period. Default is 0. With daily bars and an annual rate of 5%, set
   * `0.05 / 252`.
   */
  withRiskFreeRate(rate: number): this {
    this.riskFreeRate = rate;
    return this;
  }

  /**
   * Sets the annualization factor: the output is multiplied by it. Common values are `Math.sqrt(252)` for
   * daily bars, `Math.sqrt(52)` for weekly bars and `Math.sqrt(12)` for monthly bars.
   */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The mean log return over the current window. */
  getMeanReturn(): number {
    const n = this.windowSize();
    return n === 0 ? 0 : this.sumR / n;
  }

  /** The standard deviation of the log returns over the current window. */
  getStdDev(): number {
    const n = this.windowSize();
    if (n < 2) return 0;
    const mean = this.sumR / n;
    const variance = this.sumRSq / n - mean * mean;
    return variance <= 0 ? 0 : Math.sqrt(variance);
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

    this.window().add(logReturn);
    this.sumR += logReturn;
    this.sumRSq += logReturn * logReturn;

    const n = this.windowSize();
    if (n < 2) {
      return this.setValue(0);
    }

    const mean = this.sumR / n;
    const variance = this.sumRSq / n - mean * mean;

    if (variance <= 0) {
      return this.setValue(0);
    }

    const stddev = Math.sqrt(variance);
    const sharpe = (mean - this.riskFreeRate) / stddev;

    return this.setValue(sharpe * this.annualizationFactor);
  }
}
