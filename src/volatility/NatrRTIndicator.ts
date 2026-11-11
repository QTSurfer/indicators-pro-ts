import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, AtrRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Normalized Average True Range: the ATR as a percentage of the close, to compare the volatility of instruments,
 *
 * ```
 * NATR = ATR / close * 100
 * ```
 *
 * It is 0 when the close is 0. A bar whose high, low or close is not finite (NaN or an infinity) is left out: nothing
 * is updated and the last value is returned. The ratio is not checked: a close near zero gives a huge value. The
 * constructor throws a `RangeError` for `periods` below 1; there is no constructor without an argument.
 * Port of com.wualabs.qtsurfer.engine.indicators.volatility.pro.NatrRTIndicator
 */
export class NatrRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly atr: AtrRTIndicator;

  constructor(periods: number) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this.atr = new AtrRTIndicator(periods);
  }

  get periods(): number {
    return this.atr.periods;
  }

  override isReady(): boolean {
    return this.atr.isReady();
  }

  override reset(): void {
    super.reset();
    this.atr.reset();
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
    const natr = close !== 0 ? (this.atr.getValue() / close) * 100.0 : 0;
    return this.setValue(natr);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
