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
 * usual definition by default; with `discreteSmas` set to true they are the block averages of the base module instead, each
 * one changing once per period. A bar whose high or low is not finite (NaN or an
 * infinity) is left out: nothing is updated, the last value is returned and `getAO` keeps its last value. So is a bar
 * whose midpoint overflows, which takes a high and a low near the largest double. The class is ready when the slow
 * average and the average of the AO are: with the default periods it is ready, and equal to the definition, from the
 * 38th update, the slow average needing 34 and the average of the AO 5 values of an AO that is already valid.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.AcceleratorOscillatorRTIndicator
 */
export class AcceleratorOscillatorRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly fastSma: SmaRTIndicator;
  private readonly slowSma: SmaRTIndicator;
  private readonly aoSma: SmaRTIndicator;
  private ao = 0;

  constructor();
  constructor(discreteSmas: boolean);
  constructor(discreteSmas: boolean = false) {
    super();
    this.fastSma = new SmaRTIndicator(5).withDiscreteMode(discreteSmas);
    this.slowSma = new SmaRTIndicator(34).withDiscreteMode(discreteSmas);
    this.aoSma = new SmaRTIndicator(5).withDiscreteMode(discreteSmas);
  }

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
    // The average of the AO is fed once the AO is valid, which is when the slow average is ready: before that the AO is
    // the difference with an average still warming up, and the five values the smoothing holds would carry that into
    // the line for its first updates.
    const aoSmoothed = this.slowSma.isReady() ? this.aoSma.update(this.ao) : this.aoSma.getValue();
    return this.setValue(this.ao - aoSmoothed);
  }

  override update(newValue: number): number {
    return this.updateHL(newValue, newValue);
  }
}
