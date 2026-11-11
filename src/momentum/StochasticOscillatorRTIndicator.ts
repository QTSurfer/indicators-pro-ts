import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, SmaRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Stochastic Oscillator: where the close is between the lowest low and the highest high of the window,
 *
 * ```
 * %K = (close - lowestLow) / (highestHigh - lowestLow) * 100, smoothed by a block average of kSmooth bars
 * %D = block average of %K over dSmooth values
 * ```
 *
 * 14, 3 and 3 by default (the slow stochastic). The value is %K; `getPercentK` and `getPercentD` give the two lines.
 * The averages are the block averages of the base module: each one changes once per period, not on every bar. The raw
 * %K is 50 when the window has no range. The class is ready when the window of high and low has `kPeriod` bars,
 * whatever the smoothing. A bar whose high, low or close is not finite (NaN or an infinity) is left out: nothing is
 * updated, the last value is returned and both lines keep their last values. So is a bar whose raw %K is not finite,
 * which takes a range or a distance near the largest double; that bar has already entered the window of highs and
 * lows. The constructor throws a `RangeError` for a `kPeriod`, a `kSmooth` or a `dSmooth` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.StochasticOscillatorRTIndicator
 */
export class StochasticOscillatorRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly kPeriod: number;
  private readonly highs: Float64Array;
  private readonly lows: Float64Array;
  private head = 0;
  private count = 0;
  private readonly kSmoothing: SmaRTIndicator;
  private readonly dSmoothing: SmaRTIndicator;
  private percentK = 0;
  private percentD = 0;

  constructor();
  constructor(kPeriod: number, kSmooth: number, dSmooth: number);
  constructor(kPeriod: number = 14, kSmooth: number = 3, dSmooth: number = 3) {
    super();
    if (kPeriod < 1) {
      throw new RangeError(`KPeriod must be >= 1, got: ${kPeriod}`);
    }
    if (kSmooth < 1) {
      throw new RangeError(`KSmooth must be >= 1, got: ${kSmooth}`);
    }
    if (dSmooth < 1) {
      throw new RangeError(`DSmooth must be >= 1, got: ${dSmooth}`);
    }
    this.kPeriod = kPeriod;
    this.highs = new Float64Array(kPeriod);
    this.lows = new Float64Array(kPeriod);
    this.kSmoothing = new SmaRTIndicator(kSmooth);
    this.dSmoothing = new SmaRTIndicator(dSmooth);
  }

  getKPeriod(): number {
    return this.kPeriod;
  }

  /** The %K line, as of the last update. */
  getPercentK(): number {
    return this.percentK;
  }

  /** The %D line, as of the last update. */
  getPercentD(): number {
    return this.percentD;
  }

  override isReady(): boolean {
    return this.count >= this.kPeriod;
  }

  override reset(): void {
    super.reset();
    this.head = 0;
    this.count = 0;
    this.percentK = 0;
    this.percentD = 0;
    this.kSmoothing.reset();
    this.dSmoothing.reset();
  }

  /** It reads the high, low and close of a bar, which a ticker only gives as 24-hour statistics. */
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
    const kPeriod = this.kPeriod;
    const idx = this.count < kPeriod ? this.count : this.head;
    if (this.count >= kPeriod) this.head = (this.head + 1) % kPeriod;
    else this.count++;
    this.highs[idx] = high;
    this.lows[idx] = low;

    let hh = Number.NEGATIVE_INFINITY;
    let ll = Number.POSITIVE_INFINITY;
    const n = Math.min(this.count, kPeriod);
    for (let i = 0; i < n; i++) {
      const bi = this.count <= kPeriod ? i : (this.head + i) % kPeriod;
      if (this.highs[bi] > hh) hh = this.highs[bi];
      if (this.lows[bi] < ll) ll = this.lows[bi];
    }

    const range = hh - ll;
    const rawK = range !== 0 ? ((close - ll) / range) * 100 : 50;
    if (AbstractRTIndicator.isPoison(rawK)) {
      return this.getValue();
    }
    this.percentK = this.kSmoothing.update(rawK);
    this.percentD = this.dSmoothing.update(this.percentK);
    return this.setValue(this.percentK);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
