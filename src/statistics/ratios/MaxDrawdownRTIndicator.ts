import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Maximum drawdown of the price since the indicator started: the largest peak-to-trough decline, as a
 * fraction of the peak, `(peak - price) / peak`. Never negative: 0 means no drawdown, 1 a loss of the whole
 * price. It keeps two numbers, the peak and the largest drawdown, and `getCurrentDrawdown` gives the
 * drawdown from the peak now.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.MaxDrawdownRTIndicator
 */
export class MaxDrawdownRTIndicator extends AbstractRTIndicator {
  private peak = 0;
  private maxDrawdown = 0;
  private started = false;
  private lastPrice = 0;

  override isReady(): boolean {
    return this.started;
  }

  /** The peak (high-water mark) price observed so far. */
  getPeak(): number {
    return this.peak;
  }

  /** The current drawdown from the peak (not the largest one). */
  getCurrentDrawdown(): number {
    if (!this.started || this.peak <= 0) return 0;
    return (this.peak - this.lastPrice) / this.peak;
  }

  override update(price: number): number {
    if (AbstractRTIndicator.isPoison(price)) {
      return this.getValue();
    }
    this.lastPrice = price;
    if (!this.started) {
      this.started = true;
      this.peak = price;
      this.maxDrawdown = 0;
      return this.setValue(0);
    }

    if (price > this.peak) {
      this.peak = price;
    }

    const dd = (this.peak - price) / this.peak;
    if (dd > this.maxDrawdown) {
      this.maxDrawdown = dd;
    }

    return this.setValue(this.maxDrawdown);
  }

  override reset(): void {
    super.reset();
    this.peak = 0;
    this.maxDrawdown = 0;
    this.lastPrice = 0;
    this.started = false;
  }
}
