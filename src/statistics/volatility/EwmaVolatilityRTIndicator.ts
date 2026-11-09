import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Exponentially weighted moving average (EWMA) volatility of the log returns of the price, the RiskMetrics
 * approach: `variance = lambda * variance + (1 - lambda) * r²`, seeded with the first squared return. There
 * is no window, so it keeps three numbers (the previous price, the variance and whether it was seeded) and
 * a tick costs the same whatever the history. Lambda is in (0, 1), 0.94 by default (RiskMetrics daily); a
 * higher lambda weights the past more. `withAnnualizationFactor` multiplies the output. Reads the price,
 * not a bar.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.EwmaVolatilityRTIndicator
 */
export class EwmaVolatilityRTIndicator extends AbstractRTIndicator {
  private readonly lambda: number;
  private readonly oneMinusLambda: number;
  private prevPrice = 0;
  private variance = 0;
  private hasPrev = false;
  private hasVariance = false;
  private annualizationFactor = 1.0;

  /** The decay factor lambda, in (0, 1); 0.94 when omitted. */
  constructor(lambda = 0.94) {
    super();
    if (lambda <= 0 || lambda >= 1) {
      throw new RangeError(`Lambda must be in (0, 1), got: ${lambda}`);
    }
    this.lambda = lambda;
    this.oneMinusLambda = 1.0 - lambda;
  }

  getLambda(): number {
    return this.lambda;
  }

  override isReady(): boolean {
    return this.hasVariance;
  }

  /** The output is multiplied by this factor. */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The current EWMA variance (the squared volatility, before annualization). */
  getEwmaVariance(): number {
    return this.variance;
  }

  override reset(): void {
    super.reset();
    this.prevPrice = 0;
    this.variance = 0;
    this.hasPrev = false;
    this.hasVariance = false;
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
    const rSq = logReturn * logReturn;

    if (!this.hasVariance) {
      // Seed with the first squared return
      this.hasVariance = true;
      this.variance = rSq;
    } else {
      this.variance = this.lambda * this.variance + this.oneMinusLambda * rSq;
    }

    return this.setValue(Math.sqrt(this.variance) * this.annualizationFactor);
  }
}
