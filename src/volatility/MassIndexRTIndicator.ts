import type { Kline, Ticker } from "@qtsurfer/core";
import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator, EmaRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Mass Index: the narrowing and widening of the range between the high and the low,
 *
 * ```
 * singleEMA = EMA(high - low, emaPeriod)
 * doubleEMA = EMA(singleEMA, emaPeriod)
 * ratio     = singleEMA / doubleEMA
 * MassIndex = sum(ratio, sumPeriod)
 * ```
 *
 * 25 and 9 by default. A "reversal bulge" is a Mass Index that rises above 27 and then falls below 26.5. A bar whose high
 * or low is not finite (NaN or an infinity) is left out: nothing is updated and the last value is returned. So is a bar
 * whose range is not finite, which takes a high and a low near the largest double apart: the averages would drop it,
 * and the second would be fed the held value of the first as a new tick. The scalar `update` takes its argument as the
 * range itself. The constructor throws a `RangeError` for a `sumPeriod` or an `emaPeriod` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.volatility.pro.MassIndexRTIndicator
 */
export class MassIndexRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _sumPeriod: number;
  private readonly _emaPeriod: number;
  private readonly singleEma: EmaRTIndicator;
  private readonly doubleEma: EmaRTIndicator;
  private readonly ratioWindow: WindowSeriesStore;
  private ratioSum = 0;

  constructor();
  constructor(sumPeriod: number, emaPeriod: number);
  constructor(sumPeriod: number = 25, emaPeriod: number = 9) {
    super();
    if (sumPeriod < 1) {
      throw new RangeError(`SumPeriod must be >= 1, got: ${sumPeriod}`);
    }
    if (emaPeriod < 1) {
      throw new RangeError(`EmaPeriod must be >= 1, got: ${emaPeriod}`);
    }
    this._sumPeriod = sumPeriod;
    this._emaPeriod = emaPeriod;
    this.singleEma = new EmaRTIndicator(emaPeriod);
    this.doubleEma = new EmaRTIndicator(emaPeriod);
    this.ratioWindow = new WindowSeriesStore(sumPeriod);
  }

  getSumPeriod(): number {
    return this._sumPeriod;
  }

  getEmaPeriod(): number {
    return this._emaPeriod;
  }

  override isReady(): boolean {
    return this.ratioWindow.size === this._sumPeriod;
  }

  override reset(): void {
    super.reset();
    this.singleEma.reset();
    this.doubleEma.reset();
    this.ratioWindow.clear();
    this.ratioSum = 0;
  }

  /** It reads the high and low of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateHL(bar.high, bar.low);
  }

  updateHL(high: number, low: number): number {
    if (AbstractRTIndicator.isPoison(high) || AbstractRTIndicator.isPoison(low)) {
      return this.getValue();
    }
    const range = high - low;
    if (AbstractRTIndicator.isPoison(range)) {
      // Only reachable when the range overflows (a high and a low near the largest double apart): hold. The averages
      // would drop it, and the second one would be fed the held value of the first one as a new tick.
      return this.getValue();
    }
    const single = this.singleEma.update(range);
    const doubleVal = this.doubleEma.update(single);
    const ratio = doubleVal !== 0 ? single / doubleVal : 1.0;

    if (this.ratioWindow.size === this._sumPeriod) {
      this.ratioSum -= this.ratioWindow.getValue(0);
    }
    this.ratioWindow.add(ratio);
    this.ratioSum += ratio;

    return this.setValue(this.ratioSum);
  }

  /** Standalone mode: the argument is taken as the range between the high and the low. */
  override update(newValue: number): number {
    return this.updateHL(newValue, 0);
  }
}
