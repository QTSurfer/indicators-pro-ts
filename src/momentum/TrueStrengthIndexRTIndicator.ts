import { AbstractRTIndicator, EmaRTIndicator } from "@qtsurfer/indicators";

/**
 * True strength index (TSI): a double-smoothed momentum oscillator,
 *
 * ```
 * pc  = price - prevPrice
 * TSI = 100 * EMA(EMA(pc, longPeriod), shortPeriod) / EMA(EMA(|pc|, longPeriod), shortPeriod)
 * ```
 *
 * Four EMAs keep the state, so a tick costs the same whatever the history. 0 on the first price, and 0 while the
 * smoothed absolute change is 0. The indicator is ready once the two short EMAs are; the long ones are not looked at.
 * 25 and 13 when no argument is given (`longPeriod`, `shortPeriod`).
 * The class does not guard a value that is not finite, as in the Java class: the EMAs leave it out and hold their last
 * value, which goes on to the short EMAs as a new tick. The change of the price after a NaN price is NaN too, because
 * the NaN is the previous price.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.TrueStrengthIndexRTIndicator
 */
export class TrueStrengthIndexRTIndicator extends AbstractRTIndicator {
  private readonly pcLongEma: EmaRTIndicator;
  private readonly pcShortEma: EmaRTIndicator;
  private readonly absPcLongEma: EmaRTIndicator;
  private readonly absPcShortEma: EmaRTIndicator;
  private prevClose = 0;
  private hasPrev = false;

  constructor();
  constructor(longPeriod: number, shortPeriod: number);
  constructor(longPeriod = 25, shortPeriod = 13) {
    super();
    this.pcLongEma = new EmaRTIndicator(longPeriod);
    this.pcShortEma = new EmaRTIndicator(shortPeriod);
    this.absPcLongEma = new EmaRTIndicator(longPeriod);
    this.absPcShortEma = new EmaRTIndicator(shortPeriod);
  }

  override isReady(): boolean {
    return this.pcShortEma.isReady() && this.absPcShortEma.isReady();
  }

  override reset(): void {
    super.reset();
    this.pcLongEma.reset();
    this.pcShortEma.reset();
    this.absPcLongEma.reset();
    this.absPcShortEma.reset();
    this.prevClose = 0;
    this.hasPrev = false;
  }

  override update(newValue: number): number {
    if (!this.hasPrev) {
      this.hasPrev = true;
      this.prevClose = newValue;
      return this.setValue(0);
    }
    const pc = newValue - this.prevClose;
    const absPc = Math.abs(pc);
    this.prevClose = newValue;

    const smoothedPc = this.pcShortEma.update(this.pcLongEma.update(pc));
    const smoothedAbsPc = this.absPcShortEma.update(this.absPcLongEma.update(absPc));

    const tsi = smoothedAbsPc !== 0 ? (100.0 * smoothedPc) / smoothedAbsPc : 0;
    return this.setValue(tsi);
  }
}
