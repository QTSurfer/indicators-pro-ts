import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Vortex Indicator: two lines that show the direction and strength of a trend,
 *
 * ```
 * VM+ = |high - prevLow|
 * VM- = |low - prevHigh|
 * TR  = max(high - low, |high - prevClose|, |low - prevClose|)
 *
 * VI+ = sum(VM+, periods) / sum(TR, periods)
 * VI- = sum(VM-, periods) / sum(TR, periods)
 * ```
 *
 * The value is VI+ less VI-; `getVIPlus` and `getVIMinus` give the lines. A bar whose high, low or close is not finite
 * (NaN or an infinity) is left out: nothing is updated, the last value is returned and both lines keep their last
 * values. So is a bar whose movements, true range or running sums are not finite, which takes a price near the largest
 * double; the previous bar stays the reference. The constructor throws a `RangeError` for `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.VortexRTIndicator
 */
export class VortexRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _periods: number;
  private readonly vmPlus: Float64Array;
  private readonly vmMinus: Float64Array;
  private readonly trValues: Float64Array;
  private head = 0;
  private count = 0;
  private sumVMP = 0;
  private sumVMM = 0;
  private sumTR = 0;
  private prevHigh = 0;
  private prevLow = 0;
  private prevClose = 0;
  private viPlus = 0;
  private viMinus = 0;

  constructor(periods: number = 14) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.vmPlus = new Float64Array(periods);
    this.vmMinus = new Float64Array(periods);
    this.trValues = new Float64Array(periods);
  }

  get periods(): number {
    return this._periods;
  }

  /** The VI+ line, as of the last update. */
  getVIPlus(): number {
    return this.viPlus;
  }

  /** The VI- line, as of the last update. */
  getVIMinus(): number {
    return this.viMinus;
  }

  override isReady(): boolean {
    return this.count >= this._periods + 1;
  }

  override reset(): void {
    super.reset();
    this.head = 0;
    this.count = 0;
    this.sumVMP = this.sumVMM = this.sumTR = 0;
    this.prevHigh = this.prevLow = this.prevClose = 0;
    this.viPlus = this.viMinus = 0;
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
    const periods = this._periods;
    if (this.count === 0) {
      this.count = 1;
      this.prevHigh = high;
      this.prevLow = low;
      this.prevClose = close;
      return this.setValue(0);
    }

    const vmp = Math.abs(high - this.prevLow);
    const vmm = Math.abs(low - this.prevHigh);
    const tr = Math.max(high - low, Math.max(Math.abs(high - this.prevClose), Math.abs(low - this.prevClose)));

    const dataCount = this.count; // bars after the first one, this one included
    let idx: number;
    let nextVmp: number;
    let nextVmm: number;
    let nextTr: number;
    if (dataCount <= periods) {
      idx = dataCount - 1;
      nextVmp = this.sumVMP + vmp;
      nextVmm = this.sumVMM + vmm;
      nextTr = this.sumTR + tr;
    } else {
      idx = this.head;
      nextVmp = this.sumVMP - this.vmPlus[idx] + vmp;
      nextVmm = this.sumVMM - this.vmMinus[idx] + vmm;
      nextTr = this.sumTR - this.trValues[idx] + tr;
    }
    if (
      AbstractRTIndicator.isPoison(vmp) ||
      AbstractRTIndicator.isPoison(vmm) ||
      AbstractRTIndicator.isPoison(tr) ||
      AbstractRTIndicator.isPoison(nextVmp) ||
      AbstractRTIndicator.isPoison(nextVmm) ||
      AbstractRTIndicator.isPoison(nextTr)
    ) {
      // Only reachable when a distance or a running sum overflows (a price near the largest double): hold, and keep
      // the previous bar as the reference.
      return this.getValue();
    }
    this.count++;

    this.prevHigh = high;
    this.prevLow = low;
    this.prevClose = close;

    if (dataCount > periods) {
      this.head = (this.head + 1) % periods;
    }
    this.sumVMP = nextVmp;
    this.sumVMM = nextVmm;
    this.sumTR = nextTr;

    this.vmPlus[idx] = vmp;
    this.vmMinus[idx] = vmm;
    this.trValues[idx] = tr;

    if (this.sumTR !== 0) {
      this.viPlus = this.sumVMP / this.sumTR;
      this.viMinus = this.sumVMM / this.sumTR;
    }
    return this.setValue(this.viPlus - this.viMinus);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
