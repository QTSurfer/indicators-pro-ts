import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, EmaRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Elder's Bull Power and Bear Power: how far the high and the low of the bar are from an EMA of the close,
 *
 * ```
 * Bull Power  = high - EMA(close, period)
 * Bear Power  = low - EMA(close, period)
 * Total Power = Bull Power + Bear Power
 * ```
 *
 * The value is the total power; `getBullPower` and `getBearPower` give the two parts. 13 periods by default. A bar
 * whose high, low or close is not finite (NaN or an infinity) is left out: nothing is updated, the last value is
 * returned and both parts keep their last values. The parts are not checked: a high or a low near the largest double
 * on the other side of the EMA makes them not finite. The constructor throws a `RangeError` for a `period` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.BullBearPowerRTIndicator
 */
export class BullBearPowerRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly ema: EmaRTIndicator;
  private bullPower = 0;
  private bearPower = 0;

  constructor(period: number = 13) {
    super();
    if (period < 1) {
      throw new RangeError(`Period must be >= 1, got: ${period}`);
    }
    this.ema = new EmaRTIndicator(period);
  }

  /** The Bull Power (the high less the EMA), as of the last update. */
  getBullPower(): number {
    return this.bullPower;
  }

  /** The Bear Power (the low less the EMA), as of the last update. */
  getBearPower(): number {
    return this.bearPower;
  }

  override isReady(): boolean {
    return this.ema.isReady();
  }

  override reset(): void {
    super.reset();
    this.ema.reset();
    this.bullPower = 0;
    this.bearPower = 0;
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
    const emaValue = this.ema.update(close);
    this.bullPower = high - emaValue;
    this.bearPower = low - emaValue;
    return this.setValue(this.bullPower + this.bearPower);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
