import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";
import { javaDouble } from "$core/JavaNumber";

/**
 * Parabolic SAR (stop and reverse), Wilder's trailing stop. Each bar moves the SAR a fraction of the way to the
 * extreme point of the trend,
 *
 * ```
 * SAR(t) = SAR(t-1) + AF * (EP - SAR(t-1))
 * ```
 *
 * The acceleration factor AF starts at `afStep` (0.02 by default) and grows by `afStep` each time the trend makes a new
 * extreme, up to `afMax` (0.2 by default). The value is the SAR; `isUpTrend` gives the direction. A bar whose high or
 * low is not finite (NaN or an infinity) is left out: nothing is updated, the last value is returned and `isUpTrend`
 * keeps its last value. So is a bar whose next SAR is not finite, which takes a price near the largest double: the bar
 * has counted and, on the second bar, the trend, the SAR, the extreme point and the acceleration factor have been set
 * from it. The constructor throws a `RangeError` for an `afStep` or an `afMax` that is not finite and positive.
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.ParabolicSarRTIndicator
 */
export class ParabolicSarRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _afStep: number;
  private readonly _afMax: number;
  private sar = 0;
  private ep = 0; // extreme point
  private af = 0; // acceleration factor
  // false until the first bar, as in the Java class: only reset() sets it to true
  private upTrend = false;
  private count = 0;
  private prevHigh = 0;
  private prevLow = 0;

  constructor();
  constructor(afStep: number, afMax: number);
  constructor(afStep: number = 0.02, afMax: number = 0.2) {
    super();
    if (!(afStep > 0) || !Number.isFinite(afStep)) {
      throw new RangeError(`AfStep must be finite and > 0, got: ${javaDouble(afStep)}`);
    }
    if (!(afMax > 0) || !Number.isFinite(afMax)) {
      throw new RangeError(`AfMax must be finite and > 0, got: ${javaDouble(afMax)}`);
    }
    this._afStep = afStep;
    this._afMax = afMax;
  }

  getAfStep(): number {
    return this._afStep;
  }

  getAfMax(): number {
    return this._afMax;
  }

  /** Whether the trend is up, as of the last update. */
  isUpTrend(): boolean {
    return this.upTrend;
  }

  override isReady(): boolean {
    return this.count >= 2;
  }

  override reset(): void {
    super.reset();
    this.sar = 0;
    this.ep = 0;
    this.af = 0;
    this.upTrend = true;
    this.count = 0;
    this.prevHigh = 0;
    this.prevLow = 0;
  }

  /** It reads the high and low of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateOhlc(bar.high, bar.low);
  }

  updateOhlc(high: number, low: number): number {
    if (AbstractRTIndicator.isPoison(high) || AbstractRTIndicator.isPoison(low)) {
      return this.getValue();
    }
    const afStep = this._afStep;
    const afMax = this._afMax;
    this.count++;

    if (this.count === 1) {
      this.prevHigh = high;
      this.prevLow = low;
      this.sar = low;
      this.ep = high;
      this.af = afStep;
      this.upTrend = true;
      return this.setValue(this.sar);
    }

    if (this.count === 2) {
      if (high > this.prevHigh) {
        this.upTrend = true;
        this.sar = this.prevLow;
        this.ep = high;
      } else {
        this.upTrend = false;
        this.sar = this.prevHigh;
        this.ep = low;
      }
      this.af = afStep;
    }

    let nextSar = this.sar + this.af * (this.ep - this.sar);
    if (AbstractRTIndicator.isPoison(nextSar)) {
      // Only reachable when ep - sar overflows (a price near the largest double): hold. The bar has counted and, on the
      // second bar, the trend, the SAR, the extreme point and the acceleration factor have been set from it; nothing
      // else has changed.
      return this.getValue();
    }

    if (this.upTrend) {
      if (low < nextSar) {
        // Reverse to a down trend
        this.upTrend = false;
        nextSar = this.ep;
        this.ep = low;
        this.af = afStep;
      } else {
        // The SAR must not be above the two prior lows. The clamp is applied only when the trend does not reverse:
        // folding today's low into it before the reversal test would force nextSar <= low and make the reversal
        // unreachable.
        nextSar = Math.min(nextSar, Math.min(this.prevLow, low));
        if (high > this.ep) {
          this.ep = high;
          this.af = Math.min(this.af + afStep, afMax);
        }
      }
    } else if (high > nextSar) {
      // Reverse to an up trend
      this.upTrend = true;
      nextSar = this.ep;
      this.ep = high;
      this.af = afStep;
    } else {
      // The SAR must not be below the two prior highs (applied only when the trend does not reverse, as above)
      nextSar = Math.max(nextSar, Math.max(this.prevHigh, high));
      if (low < this.ep) {
        this.ep = low;
        this.af = Math.min(this.af + afStep, afMax);
      }
    }

    this.prevHigh = high;
    this.prevLow = low;
    this.sar = nextSar;
    return this.setValue(this.sar);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue);
  }
}
