import { AbstractRTIndicator, EmaRTIndicator } from "@qtsurfer/indicators";

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
 * `getUpper` and `getLower` give the bands. 20 periods and 2.5 percent when no argument is given.
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
    const mid = this.ema.update(newValue);
    this.upper = mid * (1 + this.factor);
    this.lower = mid * (1 - this.factor);
    return this.setValue(mid);
  }
}
