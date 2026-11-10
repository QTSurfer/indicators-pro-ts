import { AbstractRTIndicator, WmaIncrementalRTIndicator } from "@qtsurfer/indicators";
import { RocRTIndicator } from "./RocRTIndicator";

/**
 * Coppock curve: a weighted moving average of the sum of two rates of change,
 *
 * ```
 * Coppock = WMA(ROC(longRoc) + ROC(shortRoc), wmaPeriod)
 * ```
 *
 * Made to find long-term buying opportunities. The two rates of change are the `RocRTIndicator` of this package,
 * and the average is the free `WmaIncrementalRTIndicator`, so a tick costs the same whatever the history. The
 * average takes in the zeros that the rates of change give while they warm up. 14, 11 and 10 when no argument is
 * given. A value that is not finite (NaN or an infinity) is left out: nothing is updated and the last value is
 * returned. So is a sum of the two rates that is not finite (a rate overflows when its base price is near zero): the
 * rates of change take the price, and only the average is skipped. The constructor throws a `RangeError` for
 * `longRoc`, `shortRoc` or `wmaPeriod` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.CoppockCurveRTIndicator
 */
export class CoppockCurveRTIndicator extends AbstractRTIndicator {
  private readonly _longRoc: number;
  private readonly _shortRoc: number;
  private readonly _wmaPeriod: number;

  private readonly longRocIndicator: RocRTIndicator;
  private readonly shortRocIndicator: RocRTIndicator;
  private readonly wma: WmaIncrementalRTIndicator;

  constructor();
  constructor(longRoc: number, shortRoc: number, wmaPeriod: number);
  constructor(longRoc = 14, shortRoc = 11, wmaPeriod = 10) {
    super();
    if (longRoc < 1) {
      throw new RangeError(`LongRoc must be >= 1, got: ${longRoc}`);
    }
    if (shortRoc < 1) {
      throw new RangeError(`ShortRoc must be >= 1, got: ${shortRoc}`);
    }
    if (wmaPeriod < 1) {
      throw new RangeError(`WmaPeriod must be >= 1, got: ${wmaPeriod}`);
    }
    this._longRoc = longRoc;
    this._shortRoc = shortRoc;
    this._wmaPeriod = wmaPeriod;
    this.longRocIndicator = new RocRTIndicator(longRoc);
    this.shortRocIndicator = new RocRTIndicator(shortRoc);
    this.wma = new WmaIncrementalRTIndicator(wmaPeriod);
  }

  getLongRoc(): number {
    return this._longRoc;
  }

  getShortRoc(): number {
    return this._shortRoc;
  }

  getWmaPeriod(): number {
    return this._wmaPeriod;
  }

  override isReady(): boolean {
    return this.longRocIndicator.isReady() && this.shortRocIndicator.isReady() && this.wma.isReady();
  }

  override reset(): void {
    super.reset();
    this.longRocIndicator.reset();
    this.shortRocIndicator.reset();
    this.wma.reset();
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    const lr = this.longRocIndicator.update(newValue);
    const sr = this.shortRocIndicator.update(newValue);
    const rocSum = lr + sr;
    if (AbstractRTIndicator.isPoison(rocSum)) {
      // A rate of change overflowed (its base price is near zero) or the two rates cancel to NaN: the average has no
      // guard of its own, so hold. Both windows of the rates have already taken the price.
      return this.getValue();
    }
    const result = this.wma.update(rocSum);
    return this.setValue(result);
  }
}
