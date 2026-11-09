import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, AtrRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * SuperTrend: a trailing stop built on the ATR. The value is the lower band in an up trend and the
 * upper band in a down trend; the trend flips when the close crosses the active band.
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.SuperTrendRTIndicator
 */
export class SuperTrendRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly atr: AtrRTIndicator;
  private upperBand = 0;
  private lowerBand = 0;
  private upTrend = true;
  private initialized = false;
  private prevClose = 0;

  constructor(
    atrPeriod: number = 10,
    private readonly _multiplier: number = 3.0,
  ) {
    super();
    this.atr = new AtrRTIndicator(atrPeriod);
  }

  get atrPeriod(): number {
    return this.atr.periods;
  }

  get multiplier(): number {
    return this._multiplier;
  }

  isUpTrend(): boolean {
    return this.upTrend;
  }

  getUpperBand(): number {
    return this.upperBand;
  }

  getLowerBand(): number {
    return this.lowerBand;
  }

  override isReady(): boolean {
    return this.atr.isReady();
  }

  override reset(): void {
    super.reset();
    this.atr.reset();
    this.upperBand = 0;
    this.lowerBand = 0;
    this.upTrend = true;
    this.initialized = false;
    this.prevClose = 0;
  }

  /** It reads the high and low of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateOhlc(bar.high, bar.low, bar.close);
  }

  updateOhlc(high: number, low: number, close: number): number {
    if (AbstractRTIndicator.isPoison(high) || AbstractRTIndicator.isPoison(low) || AbstractRTIndicator.isPoison(close)) {
      return this.getValue();
    }
    this.atr.updateOhlc(high, low, close);
    const mid = (high + low) / 2.0;
    const atrVal = this.atr.getValue();
    const basicUpper = mid + this._multiplier * atrVal;
    const basicLower = mid - this._multiplier * atrVal;

    if (!this.initialized) {
      this.upperBand = basicUpper;
      this.lowerBand = basicLower;
      this.upTrend = true;
      this.initialized = true;
    } else {
      // Clamp the lower band: it only ratchets up when the previous close was above it
      this.lowerBand = basicLower > this.lowerBand && this.prevClose > this.lowerBand ? basicLower : this.lowerBand;
      // Clamp the upper band: it only ratchets down when the previous close was below it
      this.upperBand = basicUpper < this.upperBand && this.prevClose < this.upperBand ? basicUpper : this.upperBand;
      // Reset the bands on new basic values when the trend allows
      if (basicLower > this.lowerBand && this.prevClose <= this.lowerBand) this.lowerBand = basicLower;
      if (basicUpper < this.upperBand && this.prevClose >= this.upperBand) this.upperBand = basicUpper;

      if (this.upTrend) {
        if (close < this.lowerBand) {
          this.upTrend = false;
          this.upperBand = basicUpper;
        }
      } else if (close > this.upperBand) {
        this.upTrend = true;
        this.lowerBand = basicLower;
      }
    }
    this.prevClose = close;
    return this.setValue(this.upTrend ? this.lowerBand : this.upperBand);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
