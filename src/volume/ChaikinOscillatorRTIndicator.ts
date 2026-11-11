import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, EmaRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";
import { AdlRTIndicator } from "$volume/AdlRTIndicator";

/**
 * Chaikin Oscillator: the gap between a fast and a slow EMA of the Accumulation/Distribution Line,
 *
 * ```
 * Chaikin Oscillator = EMA(ADL, fastPeriod) - EMA(ADL, slowPeriod)
 * ```
 *
 * 3 and 10 periods by default. A bar whose high, low, close or volume is not finite (NaN or an infinity) is left out:
 * nothing is updated and the last value is returned. A bar that the line itself leaves out, because it would carry
 * the running total out of the finite range, still feeds both EMAs with the value the line held. The class is ready
 * when both EMAs are, so a fast period above the slow one makes it ready when the fast EMA completes. The constructor
 * throws a `RangeError` for a `fastPeriod` or a `slowPeriod` below 1; the fast period is not required to be shorter
 * than the slow one.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.ChaikinOscillatorRTIndicator
 */
export class ChaikinOscillatorRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly adl: AdlRTIndicator;
  private readonly fastEma: EmaRTIndicator;
  private readonly slowEma: EmaRTIndicator;

  constructor();
  constructor(fastPeriod: number, slowPeriod: number);
  constructor(fastPeriod: number = 3, slowPeriod: number = 10) {
    super();
    if (fastPeriod < 1) {
      throw new RangeError(`FastPeriod must be >= 1, got: ${fastPeriod}`);
    }
    if (slowPeriod < 1) {
      throw new RangeError(`SlowPeriod must be >= 1, got: ${slowPeriod}`);
    }
    this.adl = new AdlRTIndicator();
    this.fastEma = new EmaRTIndicator(fastPeriod);
    this.slowEma = new EmaRTIndicator(slowPeriod);
  }

  override isReady(): boolean {
    return this.fastEma.isReady() && this.slowEma.isReady();
  }

  override reset(): void {
    super.reset();
    this.adl.reset();
    this.fastEma.reset();
    this.slowEma.reset();
  }

  /** It reads the high, low, close and volume of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateHLCV(bar.high, bar.low, bar.close, bar.volume);
  }

  updateHLCV(high: number, low: number, close: number, volume: number): number {
    if (
      AbstractRTIndicator.isPoison(high) ||
      AbstractRTIndicator.isPoison(low) ||
      AbstractRTIndicator.isPoison(close) ||
      AbstractRTIndicator.isPoison(volume)
    ) {
      return this.getValue();
    }
    const adlVal = this.adl.updateHLCV(high, low, close, volume);
    const fast = this.fastEma.update(adlVal);
    const slow = this.slowEma.update(adlVal);
    return this.setValue(fast - slow);
  }

  override update(newValue: number): number {
    return this.updateHLCV(newValue, newValue, newValue, 0);
  }
}
