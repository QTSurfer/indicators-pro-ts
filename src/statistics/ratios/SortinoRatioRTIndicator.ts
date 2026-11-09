import { AbstractRTIndicator } from "@qtsurfer/indicators";
import { EvictingWindow } from "../WindowMath";

/**
 * Rolling Sortino ratio of the log returns of the price: like the Sharpe ratio, but divided by the downside
 * deviation only, `(mean - MAR) / sqrt(Σ min(r - MAR, 0)² / n)`, where MAR is the minimum acceptable return
 * (0 by default). It suits returns that are not symmetric. One window keeps the returns and another their
 * squared downside, with a running sum each; `withAnnualizationFactor` multiplies the output. 0 while the
 * window holds fewer than 2 returns or has no downside.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.SortinoRatioRTIndicator
 */
export class SortinoRatioRTIndicator extends AbstractRTIndicator {
  private readonly windowR: EvictingWindow;
  private readonly windowDown: EvictingWindow;
  private readonly _periods: number;
  private sumR = 0;
  private sumDownSq = 0;
  private prevPrice = 0;
  private hasPrev = false;
  private mar = 0;
  private annualizationFactor = 1.0;

  constructor(periods: number) {
    super();
    if (periods < 2) {
      throw new RangeError(`Periods must be >= 2, got: ${periods}`);
    }
    this._periods = periods;
    this.windowR = new EvictingWindow(periods, (evicted) => {
      this.sumR -= evicted;
    });
    this.windowDown = new EvictingWindow(periods, (evicted) => {
      this.sumDownSq -= evicted;
    });
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.windowR.size === this._periods;
  }

  /**
   * Sets the Minimum Acceptable Return (MAR) per period. Default is 0. A return below it adds to the
   * downside deviation.
   */
  withMAR(mar: number): this {
    this.mar = mar;
    return this;
  }

  /** Sets the annualization factor: the output is multiplied by it. */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The mean log return over the current window. */
  getMeanReturn(): number {
    const n = this.windowR.size;
    return n === 0 ? 0 : this.sumR / n;
  }

  /** The downside deviation of the current window. */
  getDownsideDeviation(): number {
    const n = this.windowR.size;
    if (n < 2) return 0;
    const dd = this.sumDownSq / n;
    return dd <= 0 ? 0 : Math.sqrt(dd);
  }

  override reset(): void {
    super.reset();
    this.windowR.clear();
    this.windowDown.clear();
    this.sumR = 0;
    this.sumDownSq = 0;
    this.prevPrice = 0;
    this.hasPrev = false;
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

    this.windowR.add(logReturn);
    this.sumR += logReturn;

    const downside = logReturn - this.mar;
    const downSq = downside < 0 ? downside * downside : 0;
    this.windowDown.add(downSq);
    this.sumDownSq += downSq;

    const n = this.windowR.size;
    if (n < 2) {
      return this.setValue(0);
    }

    const dd = this.sumDownSq / n;
    if (dd <= 0) {
      return this.setValue(0);
    }

    const mean = this.sumR / n;
    const sortino = (mean - this.mar) / Math.sqrt(dd);

    return this.setValue(sortino * this.annualizationFactor);
  }
}
