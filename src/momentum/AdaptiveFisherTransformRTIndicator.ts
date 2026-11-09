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
 * `maxPeriod`). Nothing checks that `minPeriod` is not above `maxPeriod`.
 * A value that is not finite is not left out, as in the Java class: it goes into the window, and the NaN that follows
 * makes the smoothed value NaN for good (until `reset`). A NaN efficiency ratio gives the period 0, as the Java
 * `(int)` of a NaN does, which is then raised to `minPeriod`.
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

    // Smoothing
    this.smoothed = 0.5 * normalized + 0.5 * this.smoothed;
    const clamped = Math.max(-CLAMP, Math.min(CLAMP, this.smoothed));

    // Fisher Transform with momentum smoothing
    const fisher = 0.5 * Math.log((1.0 + clamped) / (1.0 - clamped)) + 0.5 * this.prevFisher;
    this.prevFisher = fisher;
    return this.setValue(fisher);
  }
}
