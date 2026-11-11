import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator } from "@qtsurfer/indicators";
import { minimumPeriods } from "$core/Periods";
import { javaDouble } from "$core/JavaNumber";

/**
 * Rolling parametric (Gaussian) Value at Risk of the log returns of the price: `z * stddev - mean`, the
 * worst loss expected at a confidence level (95% by default, `withConfidenceLevel` changes it), where a
 * positive value is a potential loss. `withAnnualizationFactor` scales the mean by the factor and the
 * standard deviation by its square root. Running sums over the window: a tick costs the same whatever it is.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.ValueAtRiskRTIndicator
 */
export class ValueAtRiskRTIndicator extends AbstractWindowSeriesRTIndicator {
  private sumR = 0;
  private sumRSq = 0;
  private prevPrice = 0;
  private hasPrev = false;
  private count = 0;
  private zScore = 1.6448536269514729; // 95% confidence
  private annualizationFactor = 1.0;

  constructor(periods: number) {
    super(minimumPeriods(periods, 2));
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
    this.count = 0;
  }

  /**
   * Sets the confidence level (e.g. 0.95, 0.99). Internally converts to the corresponding z-score via an
   * approximation of the inverse normal CDF.
   */
  withConfidenceLevel(confidence: number): this {
    if (confidence <= 0 || confidence >= 1) {
      throw new RangeError(`Confidence must be in (0, 1), got: ${javaDouble(confidence)}`);
    }
    this.zScore = inverseNormalCDF(confidence);
    return this;
  }

  /**
   * Sets the annualization factor applied to both mean and stddev: the mean is scaled by the factor, the
   * stddev by its square root. Default is 1.0 (no annualization).
   */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The mean log return over the current window. */
  getMeanReturn(): number {
    const n = Math.min(this.count, this.periods);
    return n < 1 ? 0 : this.sumR / n;
  }

  /** The standard deviation of the log returns in the current window. */
  getStdDev(): number {
    const n = Math.min(this.count, this.periods);
    if (n < 2) return 0;
    const mean = this.sumR / n;
    const variance = this.sumRSq / n - mean * mean;
    return variance <= 0 ? 0 : Math.sqrt(variance);
  }

  /** The z-score used for the current confidence level. */
  getZScore(): number {
    return this.zScore;
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
    this.count++;

    const n = Math.min(this.count, this.periods);
    if (n < 2) {
      return this.setValue(0);
    }

    const mean = this.sumR / n;
    const variance = this.sumRSq / n - mean * mean;
    const stddev = variance <= 0 ? 0 : Math.sqrt(variance);

    const varMean = mean * this.annualizationFactor;
    const varStddev = stddev * Math.sqrt(this.annualizationFactor);

    return this.setValue(this.zScore * varStddev - varMean);
  }
}

/**
 * Rational approximation of the inverse normal CDF (probit function): Abramowitz and Stegun formula
 * 26.2.23, accurate to about 4.5e-4, enough for the usual VaR confidence levels. Not part of the
 * public surface of the package: the Java engine keeps it package-private.
 */
export function inverseNormalCDF(p: number): number {
  if (p <= 0 || p >= 1) throw new RangeError("p must be in (0,1)");

  if (p < 0.5) {
    return -inverseNormalCDF(1 - p);
  }

  // Rational approximation for 0.5 <= p < 1
  const t = Math.sqrt(-2 * Math.log(1 - p));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;

  return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}
