import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, AtrRTIndicator, EmaRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";
import { javaDouble } from "$core/JavaNumber";

/**
 * Keltner Channel: like Bollinger Bands, but the width comes from the ATR and not from the standard deviation,
 *
 * ```
 * Middle = EMA(close, emaPeriod)
 * Upper  = Middle + multiplier * ATR(atrPeriod)
 * Lower  = Middle - multiplier * ATR(atrPeriod)
 * ```
 *
 * The value is the middle line; `getUpper` and `getLower` give the bands. 20, 10 and 1.5 by default. A bar whose high,
 * low or close is not finite (NaN or an infinity) is left out: nothing is updated, the last value is returned and the
 * bands keep their last values. The bands are not checked: when `multiplier * ATR` overflows they are not finite. The
 * constructor throws a `RangeError` for an `emaPeriod` or `atrPeriod` below 1 and for a `multiplier` that is negative or
 * not finite (0 is accepted: both bands then equal the middle line).
 * Port of com.wualabs.qtsurfer.engine.indicators.volatility.pro.KeltnerChannelRTIndicator
 */
export class KeltnerChannelRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly ema: EmaRTIndicator;
  private readonly atr: AtrRTIndicator;
  private readonly _multiplier: number;
  private upper = 0;
  private lower = 0;

  constructor();
  constructor(emaPeriod: number, atrPeriod: number, multiplier: number);
  constructor(emaPeriod: number = 20, atrPeriod: number = 10, multiplier: number = 1.5) {
    super();
    if (emaPeriod < 1) {
      throw new RangeError(`EmaPeriod must be >= 1, got: ${emaPeriod}`);
    }
    if (atrPeriod < 1) {
      throw new RangeError(`AtrPeriod must be >= 1, got: ${atrPeriod}`);
    }
    if (!(multiplier >= 0) || !Number.isFinite(multiplier)) {
      throw new RangeError(`Multiplier must be finite and >= 0, got: ${javaDouble(multiplier)}`);
    }
    this.ema = new EmaRTIndicator(emaPeriod);
    this.atr = new AtrRTIndicator(atrPeriod);
    this._multiplier = multiplier;
  }

  getEmaPeriod(): number {
    return this.ema.periods;
  }

  getAtrPeriod(): number {
    return this.atr.periods;
  }

  getMultiplier(): number {
    return this._multiplier;
  }

  /** The upper band, as of the last update. */
  getUpper(): number {
    return this.upper;
  }

  /** The lower band, as of the last update. */
  getLower(): number {
    return this.lower;
  }

  /** The middle line, also the main value. */
  getMiddle(): number {
    return this.getValue();
  }

  override isReady(): boolean {
    return this.ema.isReady() && this.atr.isReady();
  }

  override reset(): void {
    super.reset();
    this.ema.reset();
    this.atr.reset();
    this.upper = 0;
    this.lower = 0;
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
    const emaVal = this.ema.update(close);
    this.atr.updateOhlc(high, low, close);
    const atrVal = this.atr.getValue();

    this.upper = emaVal + this._multiplier * atrVal;
    this.lower = emaVal - this._multiplier * atrVal;

    return this.setValue(emaVal);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
