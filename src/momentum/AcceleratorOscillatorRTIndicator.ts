import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, SmaRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Accelerator Oscillator (Bill Williams): how fast the Awesome Oscillator itself is changing,
 *
 * ```
 * midPrice = (high + low) / 2
 * AO       = SMA(midPrice, 5) - SMA(midPrice, 34)
 * AC       = AO - SMA(AO, 5)
 * ```
 *
 * The value is the AC; `getAO` gives the Awesome Oscillator it is built on. The averages are the block averages of the
 * base module: each one changes once per period, not on every bar. A bar whose high or low is not finite (NaN or an
 * infinity) is left out: nothing is updated, the last value is returned and `getAO` keeps its last value. So is a bar
 * whose midpoint overflows, which takes a high and a low near the largest double. The class is ready when the slow
 * average and the average of the AO are.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.AcceleratorOscillatorRTIndicator
 */
export class AcceleratorOscillatorRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly fastSma = new SmaRTIndicator(5);
  private readonly slowSma = new SmaRTIndicator(34);
  private readonly aoSma = new SmaRTIndicator(5);
  private ao = 0;

  /** The Awesome Oscillator, as of the last update. */
  getAO(): number {
    return this.ao;
  }

  override isReady(): boolean {
    return this.slowSma.isReady() && this.aoSma.isReady();
  }

  override reset(): void {
    super.reset();
    this.fastSma.reset();
    this.slowSma.reset();
    this.aoSma.reset();
    this.ao = 0;
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
    const midPrice = (high + low) / 2.0;
    if (AbstractRTIndicator.isPoison(midPrice)) {
      return this.getValue();
    }
    const fast = this.fastSma.update(midPrice);
    const slow = this.slowSma.update(midPrice);
    this.ao = fast - slow;
    const aoSmoothed = this.aoSma.update(this.ao);
    return this.setValue(this.ao - aoSmoothed);
  }

  override update(newValue: number): number {
    return this.updateHL(newValue, newValue);
  }
}
