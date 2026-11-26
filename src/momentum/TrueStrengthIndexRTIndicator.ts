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
 * smoothed absolute change is 0. The short average needs `shortPeriod` values of the long one, and the long one needs
 * `longPeriod` changes, which start at the second price, so the indicator is ready at update `longPeriod + shortPeriod`
 * (38 by default). The first update only gives the price the first change is taken from, and it counts as update 1; a
 * price that is not finite does not count.
 * 25 and 13 when no argument is given (`longPeriod`, `shortPeriod`).
 * A value that is not finite (NaN or an infinity) is left out: no average is updated and the last value is returned.
 * So is a price whose change from the last one overflows (prices near `Number.MAX_VALUE`), and the last price stays the
 * reference. The constructor throws a `RangeError` for `longPeriod` or `shortPeriod` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.TrueStrengthIndexRTIndicator
 */
export class TrueStrengthIndexRTIndicator extends AbstractRTIndicator {
  private readonly pcLongEma: EmaRTIndicator;
  private readonly pcShortEma: EmaRTIndicator;
  private readonly absPcLongEma: EmaRTIndicator;
  private readonly absPcShortEma: EmaRTIndicator;
  private readonly warmUp: number;
  private updates = 0;
  private prevClose = 0;
  private hasPrev = false;

  constructor();
  constructor(longPeriod: number, shortPeriod: number);
  constructor(longPeriod = 25, shortPeriod = 13) {
    super();
    if (longPeriod < 1) {
      throw new RangeError(`LongPeriod must be >= 1, got: ${longPeriod}`);
    }
    if (shortPeriod < 1) {
      throw new RangeError(`ShortPeriod must be >= 1, got: ${shortPeriod}`);
    }
    this.pcLongEma = new EmaRTIndicator(longPeriod);
    this.pcShortEma = new EmaRTIndicator(shortPeriod);
    this.absPcLongEma = new EmaRTIndicator(longPeriod);
    this.absPcShortEma = new EmaRTIndicator(shortPeriod);
    this.warmUp = longPeriod + shortPeriod;
  }

  override isReady(): boolean {
    return this.updates >= this.warmUp;
  }

  override reset(): void {
    super.reset();
    this.pcLongEma.reset();
    this.pcShortEma.reset();
    this.absPcLongEma.reset();
    this.absPcShortEma.reset();
    this.updates = 0;
    this.prevClose = 0;
    this.hasPrev = false;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    if (!this.hasPrev) {
      this.hasPrev = true;
      this.prevClose = newValue;
      this.updates++;
      return this.setValue(0);
    }
    const pc = newValue - this.prevClose;
    if (AbstractRTIndicator.isPoison(pc)) {
      // Only reachable when the difference overflows (|price| near Number.MAX_VALUE): hold, and keep the previous price
      // as the reference.
      return this.getValue();
    }
    if (this.updates < this.warmUp) {
      this.updates++;
    }
    const absPc = Math.abs(pc);
    this.prevClose = newValue;

    const smoothedPc = this.pcShortEma.update(this.pcLongEma.update(pc));
    const smoothedAbsPc = this.absPcShortEma.update(this.absPcLongEma.update(absPc));

    const tsi = smoothedAbsPc !== 0 ? (100.0 * smoothedPc) / smoothedAbsPc : 0;
    return this.setValue(tsi);
  }
}
