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
 * given. A value that is not finite is not left out, as in the Java class: it goes into the rates of change and, with
 * them, into the average, whose sums a NaN price turns to NaN for good (until `reset`).
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
    const lr = this.longRocIndicator.update(newValue);
    const sr = this.shortRocIndicator.update(newValue);
    const rocSum = lr + sr;
    const result = this.wma.update(rocSum);
    return this.setValue(result);
  }
}
