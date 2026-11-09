import { AbstractRTIndicator } from "@qtsurfer/indicators";
import { EvictingWindow } from "../WindowMath";

/**
 * Rolling Omega ratio: the gains over the losses of the log returns of the price against a threshold (0 by
 * default), `Σ max(r - threshold, 0) / Σ max(threshold - r, 0)` over a window. Unlike the Sharpe ratio it
 * looks at the whole distribution of the returns, not at its first two moments. Above 1 there is more gain
 * than loss. Two windows keep the gain and the loss of each return, with a running sum each. 0 while the
 * window holds no loss.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.OmegaRatioRTIndicator
 */
export class OmegaRatioRTIndicator extends AbstractRTIndicator {
  private readonly windowGain: EvictingWindow;
  private readonly windowLoss: EvictingWindow;
  private readonly _periods: number;
  private sumGains = 0;
  private sumLosses = 0;
  private prevPrice = 0;
  private hasPrev = false;
  private threshold = 0;

  constructor(periods: number) {
    super();
    if (periods < 2) {
      throw new RangeError(`Periods must be >= 2, got: ${periods}`);
    }
    this._periods = periods;
    this.windowGain = new EvictingWindow(periods, (evicted) => {
      this.sumGains -= evicted;
    });
    this.windowLoss = new EvictingWindow(periods, (evicted) => {
      this.sumLosses -= evicted;
    });
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.windowGain.size === this._periods;
  }

  /**
   * Sets the threshold that tells a gain from a loss. Default is 0. A return above it counts as a gain,
   * below it as a loss.
   */
  withThreshold(threshold: number): this {
    this.threshold = threshold;
    return this;
  }

  /** The sum of the gains above the threshold in the current window. */
  getSumGains(): number {
    return this.sumGains;
  }

  /** The sum of the losses below the threshold in the current window. */
  getSumLosses(): number {
    return this.sumLosses;
  }

  override reset(): void {
    super.reset();
    this.windowGain.clear();
    this.windowLoss.clear();
    this.sumGains = 0;
    this.sumLosses = 0;
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

    const excess = logReturn - this.threshold;
    const gain = excess > 0 ? excess : 0;
    const loss = excess < 0 ? -excess : 0;

    this.windowGain.add(gain);
    this.windowLoss.add(loss);
    this.sumGains += gain;
    this.sumLosses += loss;

    if (this.sumLosses <= 0) {
      return this.setValue(0);
    }

    return this.setValue(this.sumGains / this.sumLosses);
  }
}
