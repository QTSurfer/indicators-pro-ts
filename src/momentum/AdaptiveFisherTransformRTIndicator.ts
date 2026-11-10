import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator } from "@qtsurfer/indicators";

const CLAMP = 0.999;

/**
 * Adaptive Fisher transform: the Fisher transform with a normalization window that follows the market, chosen by
 * Kaufman's efficiency ratio,
 *
 * ```
 * ER             = |price - price[erPeriod]| / sum(|change|, erPeriod)
 * adaptivePeriod = round(minPeriod + (1 - ER) * (maxPeriod - minPeriod))
 * normalized     = 2 * (price - lowest(adaptivePeriod)) / (highest - lowest) - 1      (kept in [-0.999, 0.999])
 * smoothed       = 0.5 * normalized + 0.5 * prevSmoothed
 * fisher         = 0.5 * ln((1 + smoothed) / (1 - smoothed)) + 0.5 * prevFisher
 * ```
 *
 * A trending market (ER near 1) gets a short window and a fast answer, a choppy one (ER near 0) a long window and a
 * smoother one. The efficiency ratio is 0 until the window holds more than `erPeriod` prices. The window holds
 * `maxPeriod` prices and a tick costs a pass over it; the period is rounded and clamped to `[minPeriod, maxPeriod]`
 * as a Java `int`. `getEfficiencyRatio` and `getAdaptivePeriod` give the ratio and the window of the last update; the
 * window is `maxPeriod` before the first one. 10, 5 and 20 when no argument is given (`erPeriod`, `minPeriod`,
 * `maxPeriod`).
 * A value that is not finite (NaN or an infinity) is left out: nothing is updated, the last value is returned and
 * the efficiency ratio and the adaptive period keep their last values. The constructor throws a `RangeError` for
 * `erPeriod` below 1, `minPeriod` below 2, `minPeriod` above `maxPeriod` and `erPeriod` not below `maxPeriod` (the
 * window of `maxPeriod` prices must hold `erPeriod + 1` of them), checked in this order.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.AdaptiveFisherTransformRTIndicator
 */
export class AdaptiveFisherTransformRTIndicator extends AbstractRTIndicator {
  private readonly _erPeriod: number;
  private readonly minPeriod: number;
  private readonly maxPeriod: number;
  private readonly window: WindowSeriesStore;
  private smoothed = 0;
  private prevFisher = 0;
  private efficiencyRatio = 0;
  private adaptivePeriod: number;
  private count = 0;

  constructor();
  constructor(erPeriod: number, minPeriod: number, maxPeriod: number);
  constructor(erPeriod = 10, minPeriod = 5, maxPeriod = 20) {
    super();
    if (erPeriod < 1) {
      throw new RangeError(`ErPeriod must be >= 1, got: ${erPeriod}`);
    }
    if (minPeriod < 2) {
      throw new RangeError(`MinPeriod must be >= 2, got: ${minPeriod}`);
    }
    if (minPeriod > maxPeriod) {
      throw new RangeError(`MinPeriod must be <= MaxPeriod, got: ${minPeriod} and ${maxPeriod}`);
    }
    if (erPeriod >= maxPeriod) {
      throw new RangeError(`ErPeriod must be < MaxPeriod, got: ${erPeriod} and ${maxPeriod}`);
    }
    this._erPeriod = erPeriod;
    this.minPeriod = minPeriod;
    this.maxPeriod = maxPeriod;
    this.window = new WindowSeriesStore(maxPeriod);
    this.adaptivePeriod = maxPeriod;
  }

  getErPeriod(): number {
    return this._erPeriod;
  }

  /** The efficiency ratio of the last update. */
  getEfficiencyRatio(): number {
    return this.efficiencyRatio;
  }

  /** The length of the normalization window of the last update. */
  getAdaptivePeriod(): number {
    return this.adaptivePeriod;
  }

  override isReady(): boolean {
    return this.count >= this.maxPeriod;
  }

  override reset(): void {
    super.reset();
    this.window.clear();
    this.smoothed = 0;
    this.prevFisher = 0;
    this.efficiencyRatio = 0;
    this.adaptivePeriod = this.maxPeriod;
    this.count = 0;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    this.window.add(newValue);
    this.count++;

    const size = this.window.size;

    // Compute efficiency ratio when enough data
    if (size > this._erPeriod) {
      const direction = Math.abs(newValue - this.window.getValue(size - 1 - this._erPeriod));
      let volatility = 0;
      for (let i = size - this._erPeriod; i < size; i++) {
        volatility += Math.abs(this.window.getValue(i) - this.window.getValue(i - 1));
      }
      this.efficiencyRatio = volatility === 0 ? 0 : direction / volatility;
    } else {
      this.efficiencyRatio = 0;
    }

    // Adaptive period: trending -> short, choppy -> long. Java: (int) Math.round(...), where a NaN is 0 and the
    // `| 0` keeps the 32 low bits; maxPeriod - minPeriod is an int subtraction.
    this.adaptivePeriod = Math.round(this.minPeriod + (1.0 - this.efficiencyRatio) * ((this.maxPeriod - this.minPeriod) | 0)) | 0;
    this.adaptivePeriod = Math.max(this.minPeriod, Math.min(this.maxPeriod, this.adaptivePeriod));

    // Use at most 'adaptivePeriod' recent values for min/max normalization
    const lookback = Math.min(this.adaptivePeriod, size);
    let max = Number.NEGATIVE_INFINITY;
    let min = Number.POSITIVE_INFINITY;
    for (let i = size - lookback; i < size; i++) {
      const v = this.window.getValue(i);
      if (v > max) max = v;
      if (v < min) min = v;
    }

    const range = max - min;
    let normalized: number;
    if (range !== 0) {
      normalized = (2.0 * (newValue - min)) / range - 1.0;
    } else {
      normalized = 0;
    }
    normalized = Math.max(-CLAMP, Math.min(CLAMP, normalized));
    if (AbstractRTIndicator.isPoison(normalized)) {
      // Only reachable when the window range overflows (|price| near Number.MAX_VALUE): the price, the count, the
      // efficiency ratio and the adaptive period have already advanced; smoothed and prevFisher stay as they were.
      return this.getValue();
    }

    // Smoothing
    this.smoothed = 0.5 * normalized + 0.5 * this.smoothed;
    const clamped = Math.max(-CLAMP, Math.min(CLAMP, this.smoothed));

    // Fisher Transform with momentum smoothing
    const fisher = 0.5 * Math.log((1.0 + clamped) / (1.0 - clamped)) + 0.5 * this.prevFisher;
    this.prevFisher = fisher;
    return this.setValue(fisher);
  }
}
