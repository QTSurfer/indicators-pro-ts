import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator } from "@qtsurfer/indicators";

/**
 * Rolling realized volatility: the standard deviation of the log returns of the price over a window,
 * `sqrt(sumRSq / n - (sumR / n)²)`. Two running sums (of the returns and of their squares) keep it, so a tick
 * costs the same whatever the window. The first price only sets the previous price, so the window fills from
 * the second tick. `withAnnualizationFactor` multiplies the output (for example `Math.sqrt(252)` for daily
 * bars). Reads the price, not a bar.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.RealizedVolatilityRTIndicator
 */
export class RealizedVolatilityRTIndicator extends AbstractWindowSeriesRTIndicator {
  private sumR = 0;
  private sumRSq = 0;
  private prevPrice = 0;
  private hasPrev = false;
  private annualizationFactor = 1.0;

  constructor(periods: number) {
    super(periods);
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

  /** The output is multiplied by this factor. */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The mean log return over the current window. */
  getMeanReturn(): number {
    const n = this.windowSize();
    return n === 0 ? 0 : this.sumR / n;
  }

  /** The current realized variance (the squared realized volatility, before annualization). */
  getRealizedVariance(): number {
    const n = this.windowSize();
    if (n < 1) return 0;
    const mean = this.sumR / n;
    const variance = this.sumRSq / n - mean * mean;
    return variance < 0 ? 0 : variance;
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
    const mean = this.sumR / n;
    let variance = this.sumRSq / n - mean * mean;
    if (variance < 0) {
      variance = 0;
    }

    return this.setValue(Math.sqrt(variance) * this.annualizationFactor);
  }
}
