import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Balance of Power: how far the close moved from the open, as a share of the range of the bar,
 *
 * ```
 * BOP = (close - open) / (high - low)
 * ```
 *
 * Positive when the buyers won the bar and negative when the sellers did; 0 when the high equals the low. A bar whose
 * open, high, low or close is not finite (NaN or an infinity) is left out: the last value is returned. The ratio is
 * not checked: a range or a move near the largest double can make it not finite. The class is ready after its first
 * bar that is not left out.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.BalanceOfPowerRTIndicator
 */
export class BalanceOfPowerRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private started = false;

  override isReady(): boolean {
    return this.started;
  }

  override reset(): void {
    super.reset();
    this.started = false;
  }

  /** It reads the open, high, low and close of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateOhlc(bar.open, bar.high, bar.low, bar.close);
  }

  updateOhlc(open: number, high: number, low: number, close: number): number {
    if (
      AbstractRTIndicator.isPoison(open) ||
      AbstractRTIndicator.isPoison(high) ||
      AbstractRTIndicator.isPoison(low) ||
      AbstractRTIndicator.isPoison(close)
    ) {
      return this.getValue();
    }
    this.started = true;
    const range = high - low;
    const bop = range !== 0 ? (close - open) / range : 0;
    return this.setValue(bop);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue, newValue);
  }
}
