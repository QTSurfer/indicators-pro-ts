import { AbstractRTIndicator, EmaRTIndicator } from "@qtsurfer/indicators";
import { javaDouble } from "$core/JavaNumber";

/**
 * Moving average envelopes: bands at a fixed percentage above and below an EMA of the price,
 *
 * ```
 * middle = EMA(price, periods)
 * upper  = middle * (1 + percentage / 100)
 * lower  = middle * (1 - percentage / 100)
 * ```
 *
 * Simpler than Bollinger Bands: the bands do not widen with the volatility. The value is the middle line;
 * `getUpper` and `getLower` give the bands. 20 periods and 2.5 percent when no argument is given. A value that is not
 * finite (NaN or an infinity) is left out: the average is not updated, the last value is returned and the bands keep
 * their last values. The constructor throws a `RangeError` for `periods` below 1 and for a `percentage` that is
 * negative or not finite (0 is accepted: both bands then equal the middle line).
 * Port of com.wualabs.qtsurfer.engine.indicators.averages.pro.EnvelopesRTIndicator
 */
export class EnvelopesRTIndicator extends AbstractRTIndicator {
  private readonly ema: EmaRTIndicator;
  private readonly factor: number; // percentage / 100
  private upper = 0;
  private lower = 0;

  constructor();
  constructor(periods: number, percentage: number);
  constructor(periods = 20, percentage = 2.5) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    if (!(percentage >= 0) || !Number.isFinite(percentage)) {
      throw new RangeError(`Percentage must be finite and >= 0, got: ${javaDouble(percentage)}`);
    }
    this.ema = new EmaRTIndicator(periods);
    this.factor = percentage / 100.0;
  }

  /** The upper band, as of the last update. */
  getUpper(): number {
    return this.upper;
  }

  /** The lower band, as of the last update. */
  getLower(): number {
    return this.lower;
  }

  override isReady(): boolean {
    return this.ema.isReady();
  }

  override reset(): void {
    super.reset();
    this.ema.reset();
    this.upper = 0;
    this.lower = 0;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    const mid = this.ema.update(newValue);
    this.upper = mid * (1 + this.factor);
    this.lower = mid * (1 - this.factor);
    return this.setValue(mid);
  }
}
