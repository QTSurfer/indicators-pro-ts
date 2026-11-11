import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator, RsiRTIndicator } from "@qtsurfer/indicators";

/**
 * Connors RSI: the mean of three parts,
 *
 * ```
 * CRSI = (RSI(price, rsiPeriod) + RSI(streak, streakRsiPeriod) + percentRank(roc, rankPeriod)) / 3
 * ```
 *
 * The streak counts the consecutive rises and falls of the price: +1, +2, +3... for rises, -1, -2, -3... for
 * falls, and 0 when the price does not change. The percent rank is the share of the last `rankPeriod` one-tick rates
 * of change (in percent) that are less than or equal to the current one, the current one left out of the count.
 * Both RSIs are the free `RsiRTIndicator` with its default averages. The window of the rates of change costs a pass
 * over it on every tick. 0 on the first price, 0 as the percent rank while the window holds one rate. 3, 2 and 100
 * when no argument is given.
 * A value that is not finite (NaN or an infinity) is left out: nothing is updated and the last value is returned. The
 * one-tick rate of change can overflow to an infinity when the last price is near zero; the rank only compares it, so it
 * stays in the window. The constructor throws a `RangeError` for `rsiPeriod` or `streakRsiPeriod` below 1 and for `rankPeriod`
 * below 2: the rank of a single value is undefined.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.ConnorsRsiRTIndicator
 */
export class ConnorsRsiRTIndicator extends AbstractRTIndicator {
  private readonly _rsiPeriod: number;
  private readonly _streakRsiPeriod: number;
  private readonly _rankPeriod: number;

  private readonly priceRsi: RsiRTIndicator;
  private readonly streakRsi: RsiRTIndicator;
  private readonly rocWindow: WindowSeriesStore;

  private prevClose = 0;
  private streak = 0;
  private initialized = false;

  constructor();
  constructor(rsiPeriod: number, streakRsiPeriod: number, rankPeriod: number);
  constructor(rsiPeriod = 3, streakRsiPeriod = 2, rankPeriod = 100) {
    super();
    if (rsiPeriod < 1) {
      throw new RangeError(`RsiPeriod must be >= 1, got: ${rsiPeriod}`);
    }
    if (streakRsiPeriod < 1) {
      throw new RangeError(`StreakRsiPeriod must be >= 1, got: ${streakRsiPeriod}`);
    }
    if (rankPeriod < 2) {
      throw new RangeError(`RankPeriod must be >= 2, got: ${rankPeriod}`);
    }
    this._rsiPeriod = rsiPeriod;
    this._streakRsiPeriod = streakRsiPeriod;
    this._rankPeriod = rankPeriod;
    this.priceRsi = new RsiRTIndicator(rsiPeriod);
    this.streakRsi = new RsiRTIndicator(streakRsiPeriod);
    this.rocWindow = new WindowSeriesStore(rankPeriod);
  }

  getRsiPeriod(): number {
    return this._rsiPeriod;
  }

  getStreakRsiPeriod(): number {
    return this._streakRsiPeriod;
  }

  getRankPeriod(): number {
    return this._rankPeriod;
  }

  override isReady(): boolean {
    return this.initialized && this.priceRsi.isReady() && this.streakRsi.isReady() && this.rocWindow.size === this._rankPeriod;
  }

  override reset(): void {
    super.reset();
    this.priceRsi.reset();
    this.streakRsi.reset();
    this.rocWindow.clear();
    this.prevClose = 0;
    this.streak = 0;
    this.initialized = false;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    if (!this.initialized) {
      this.prevClose = newValue;
      this.initialized = true;
      this.priceRsi.update(newValue);
      this.streakRsi.update(0);
      return this.setValue(0);
    }

    // Update streak
    if (newValue > this.prevClose) {
      this.streak = this.streak > 0 ? this.streak + 1 : 1;
    } else if (newValue < this.prevClose) {
      this.streak = this.streak < 0 ? this.streak - 1 : -1;
    } else {
      this.streak = 0;
    }

    // ROC (1-period)
    const roc = this.prevClose !== 0 ? ((newValue - this.prevClose) / this.prevClose) * 100 : 0;
    this.prevClose = newValue;

    // Update components
    const rsiVal = this.priceRsi.update(newValue);
    const streakRsiVal = this.streakRsi.update(this.streak);

    // Percent rank of current ROC within the window
    this.rocWindow.add(roc);
    const pctRank = this.percentRank(roc);

    return this.setValue((rsiVal + streakRsiVal + pctRank) / 3.0);
  }

  private percentRank(currentRoc: number): number {
    const size = this.rocWindow.size;
    if (size <= 1) {
      return 0;
    }
    let countLessOrEqual = 0;
    for (let i = 0; i < size; i++) {
      if (this.rocWindow.getValue(i) <= currentRoc) {
        countLessOrEqual++;
      }
    }
    // Exclude the current value itself from the count denominator
    return ((countLessOrEqual - 1) / (size - 1)) * 100;
  }
}
