import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, SmaRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Awesome Oscillator (Bill Williams): the momentum of the midpoint of the bar,
 *
 * ```
 * midpoint = (high + low) / 2
 * AO       = SMA(midpoint, fastPeriod) - SMA(midpoint, slowPeriod)
 * ```
 *
 * 5 and 34 periods by default. The averages are the block averages of the base module: each one changes once per
 * period, not on every bar. A bar whose midpoint is not finite is left out: nothing is updated and the last value is
 * returned. That is a bar with a high or a low that is NaN or an infinity, and also one whose high and low are so
 * large that their sum overflows. The scalar `update` takes its argument as the midpoint itself. The class is ready
 * when both averages are, so a fast period above the slow one makes it ready when the fast average completes. The
 * constructor throws a `RangeError` for a `fastPeriod` or a `slowPeriod` below 1; the fast period is not required to
 * be shorter than the slow one.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.AwesomeOscillatorRTIndicator
 */
export class AwesomeOscillatorRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly fastSma: SmaRTIndicator;
  private readonly slowSma: SmaRTIndicator;

  constructor();
  constructor(fastPeriod: number, slowPeriod: number);
  constructor(fastPeriod: number = 5, slowPeriod: number = 34) {
    super();
    if (fastPeriod < 1) {
      throw new RangeError(`FastPeriod must be >= 1, got: ${fastPeriod}`);
    }
    if (slowPeriod < 1) {
      throw new RangeError(`SlowPeriod must be >= 1, got: ${slowPeriod}`);
    }
    this.fastSma = new SmaRTIndicator(fastPeriod);
    this.slowSma = new SmaRTIndicator(slowPeriod);
  }

  override isReady(): boolean {
    return this.fastSma.isReady() && this.slowSma.isReady();
  }

  override reset(): void {
    super.reset();
    this.fastSma.reset();
    this.slowSma.reset();
  }

  /** It reads the high and low of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateMidpoint((bar.high + bar.low) / 2.0);
  }

  updateMidpoint(midpoint: number): number {
    if (AbstractRTIndicator.isPoison(midpoint)) {
      return this.getValue();
    }
    const fast = this.fastSma.update(midpoint);
    const slow = this.slowSma.update(midpoint);
    return this.setValue(fast - slow);
  }

  override update(newValue: number): number {
    return this.updateMidpoint(newValue);
  }
}
