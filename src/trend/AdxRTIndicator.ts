import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Average Directional Index with Wilder's smoothing, and the plus and minus directional indicators
 * (DI) it comes from. Ready after twice its period.
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.AdxRTIndicator
 */
export class AdxRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private prevHigh = 0;
  private prevLow = 0;
  private prevClose = 0;
  private smoothedPlusDM = 0;
  private smoothedMinusDM = 0;
  private smoothedTR = 0;
  private plusDI = 0;
  private minusDI = 0;
  private adx = 0;
  private count = 0;
  private sumPlusDM = 0;
  private sumMinusDM = 0;
  private sumTR = 0;
  private sumDX = 0;

  constructor(private readonly _periods: number = 14) {
    super();
  }

  get periods(): number {
    return this._periods;
  }

  getPlusDI(): number {
    return this.plusDI;
  }

  getMinusDI(): number {
    return this.minusDI;
  }

  override isReady(): boolean {
    return this.count >= 2 * this._periods;
  }

  override reset(): void {
    super.reset();
    this.prevHigh = this.prevLow = this.prevClose = 0;
    this.smoothedPlusDM = this.smoothedMinusDM = this.smoothedTR = 0;
    this.plusDI = this.minusDI = this.adx = 0;
    this.count = 0;
    this.sumPlusDM = this.sumMinusDM = this.sumTR = this.sumDX = 0;
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
    this.count++;

    if (this.count === 1) {
      this.prevHigh = high;
      this.prevLow = low;
      this.prevClose = close;
      return this.setValue(0);
    }

    // Directional Movement
    const upMove = high - this.prevHigh;
    const downMove = this.prevLow - low;
    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;

    // True Range
    const tr = Math.max(high - low, Math.max(Math.abs(high - this.prevClose), Math.abs(low - this.prevClose)));

    this.prevHigh = high;
    this.prevLow = low;
    this.prevClose = close;

    if (this.count <= periods + 1) {
      // Accumulate the first n periods (count 2 to periods + 1)
      this.sumPlusDM += plusDM;
      this.sumMinusDM += minusDM;
      this.sumTR += tr;

      if (this.count === periods + 1) {
        this.smoothedPlusDM = this.sumPlusDM;
        this.smoothedMinusDM = this.sumMinusDM;
        this.smoothedTR = this.sumTR;
        if (this.smoothedTR !== 0) {
          this.plusDI = (100.0 * this.smoothedPlusDM) / this.smoothedTR;
          this.minusDI = (100.0 * this.smoothedMinusDM) / this.smoothedTR;
        }
        const diSum = this.plusDI + this.minusDI;
        this.sumDX = diSum !== 0 ? (100.0 * Math.abs(this.plusDI - this.minusDI)) / diSum : 0;
      }
      return this.setValue(0);
    }

    // Wilder's smoothing for DM and TR
    this.smoothedPlusDM = this.smoothedPlusDM - this.smoothedPlusDM / periods + plusDM;
    this.smoothedMinusDM = this.smoothedMinusDM - this.smoothedMinusDM / periods + minusDM;
    this.smoothedTR = this.smoothedTR - this.smoothedTR / periods + tr;

    if (this.smoothedTR !== 0) {
      this.plusDI = (100.0 * this.smoothedPlusDM) / this.smoothedTR;
      this.minusDI = (100.0 * this.smoothedMinusDM) / this.smoothedTR;
    }

    const diSum = this.plusDI + this.minusDI;
    const dx = diSum !== 0 ? (100.0 * Math.abs(this.plusDI - this.minusDI)) / diSum : 0;

    const adxCount = this.count - periods - 1; // DX values we have after the first DI

    if (adxCount < periods) {
      this.sumDX += dx;
      if (adxCount === periods - 1) {
        this.adx = this.sumDX / periods;
      }
    } else {
      // Wilder's smoothing for the ADX
      this.adx = (this.adx * (periods - 1) + dx) / periods;
    }

    return this.setValue(this.adx);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
