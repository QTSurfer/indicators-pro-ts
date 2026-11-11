import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, SmaRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

const BUFFER_SIZE = 4;
const WEIGHTS = [1.0, 2.0, 2.0, 1.0];
const WEIGHT_SUM = 6.0;

/**
 * Relative Vigor Index: how firmly the close follows the open compared with the range of the bar,
 *
 * ```
 * numerator   = (1 * (close - open) + 2 * (close[1] - open[1]) + 2 * (close[2] - open[2]) + 1 * (close[3] - open[3])) / 6
 * denominator = (1 * (high - low)   + 2 * (high[1] - low[1])   + 2 * (high[2] - low[2])   + 1 * (high[3] - low[3]))   / 6
 * RVI         = SMA(numerator, period) / SMA(denominator, period)
 * ```
 *
 * The weights 1, 2, 2, 1 are applied to the last four bars, and the result is smoothed by the block average of the base
 * module, which changes once per period. 10 periods by default; the value is 0 while the four bars are not in, and
 * when the average of the denominator is 0. A bar whose open, high, low or close is not finite (NaN or an infinity) is
 * left out: nothing is updated and the last value is returned. So is a bar whose difference of close and open, or of
 * high and low, overflows. A bar whose weighted sums overflow has already entered the four-bar buffers, but neither
 * average is fed. The constructor throws a `RangeError` for a `period` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.RelativeVigorIndexRTIndicator
 */
export class RelativeVigorIndexRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly numSma: SmaRTIndicator;
  private readonly denSma: SmaRTIndicator;
  private readonly numBuffer = new Float64Array(BUFFER_SIZE);
  private readonly denBuffer = new Float64Array(BUFFER_SIZE);
  private bufferIndex = 0;
  private bufferCount = 0;

  constructor(period: number = 10) {
    super();
    if (period < 1) {
      throw new RangeError(`Period must be >= 1, got: ${period}`);
    }
    this.numSma = new SmaRTIndicator(period);
    this.denSma = new SmaRTIndicator(period);
  }

  override isReady(): boolean {
    return this.bufferCount >= BUFFER_SIZE && this.numSma.isReady();
  }

  override reset(): void {
    super.reset();
    this.numSma.reset();
    this.denSma.reset();
    this.bufferIndex = 0;
    this.bufferCount = 0;
    this.numBuffer.fill(0);
    this.denBuffer.fill(0);
  }

  /** It reads the open, high, low and close of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateOhlc(bar.open, bar.high, bar.low, bar.close);
  }

  updateOhlc(open: number, high: number, low: number, close: number): number {
    if (
      AbstractRTIndicator.isPoison(open) ||
      AbstractRTIndicator.isPoison(high) ||
      AbstractRTIndicator.isPoison(low) ||
      AbstractRTIndicator.isPoison(close)
    ) {
      return this.getValue();
    }
    const numerator = close - open;
    const denominator = high - low;
    if (AbstractRTIndicator.isPoison(numerator) || AbstractRTIndicator.isPoison(denominator)) {
      return this.getValue();
    }
    this.numBuffer[this.bufferIndex] = numerator;
    this.denBuffer[this.bufferIndex] = denominator;
    this.bufferIndex = (this.bufferIndex + 1) % BUFFER_SIZE;
    if (this.bufferCount < BUFFER_SIZE) {
      this.bufferCount++;
    }

    if (this.bufferCount < BUFFER_SIZE) {
      return this.setValue(0);
    }

    // The oldest value is at bufferIndex
    let weightedNum = 0;
    let weightedDen = 0;
    for (let i = 0; i < BUFFER_SIZE; i++) {
      const idx = (this.bufferIndex + i) % BUFFER_SIZE;
      weightedNum += WEIGHTS[i] * this.numBuffer[idx];
      weightedDen += WEIGHTS[i] * this.denBuffer[idx];
    }
    weightedNum /= WEIGHT_SUM;
    weightedDen /= WEIGHT_SUM;
    if (AbstractRTIndicator.isPoison(weightedNum) || AbstractRTIndicator.isPoison(weightedDen)) {
      return this.getValue();
    }

    const numSmoothed = this.numSma.update(weightedNum);
    const denSmoothed = this.denSma.update(weightedDen);

    const rvi = denSmoothed !== 0 ? numSmoothed / denSmoothed : 0;
    return this.setValue(rvi);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue, newValue);
  }
}
