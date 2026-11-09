import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/**
 * Ichimoku Kinko Hyo: the Tenkan-sen (conversion line, also the main value), Kijun-sen (base line),
 * Senkou spans A and B (leading spans) and the Chikou span (the current close). The spans are not
 * shifted ahead: they are the values of the bar they are worked out on.
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.IchimokuRTIndicator
 */
export class IchimokuRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly highBuffer: Float64Array;
  private readonly lowBuffer: Float64Array;
  private head = 0;
  private count = 0;

  private tenkanSen = 0;
  private kijunSen = 0;
  private senkouSpanA = 0;
  private senkouSpanB = 0;
  private chikouSpan = 0;

  constructor(
    private readonly _tenkanPeriod: number = 9,
    private readonly _kijunPeriod: number = 26,
    private readonly _senkouPeriod: number = 52,
  ) {
    super();
    this.highBuffer = new Float64Array(_senkouPeriod);
    this.lowBuffer = new Float64Array(_senkouPeriod);
  }

  get tenkanPeriod(): number {
    return this._tenkanPeriod;
  }

  get kijunPeriod(): number {
    return this._kijunPeriod;
  }

  get senkouPeriod(): number {
    return this._senkouPeriod;
  }

  override isReady(): boolean {
    return this.count >= this._senkouPeriod;
  }

  /** Whether the Tenkan-sen and the Kijun-sen are available, before the Senkou spans are. */
  isTenkanKijunReady(): boolean {
    return this.count >= this._kijunPeriod;
  }

  /** The Tenkan-sen (conversion line), also the main value. */
  getTenkanSen(): number {
    return this.tenkanSen;
  }

  getKijunSen(): number {
    return this.kijunSen;
  }

  getSenkouSpanA(): number {
    return this.senkouSpanA;
  }

  getSenkouSpanB(): number {
    return this.senkouSpanB;
  }

  /** The Chikou span: the current close. */
  getChikouSpan(): number {
    return this.chikouSpan;
  }

  override reset(): void {
    super.reset();
    this.head = 0;
    this.count = 0;
    this.tenkanSen = 0;
    this.kijunSen = 0;
    this.senkouSpanA = 0;
    this.senkouSpanB = 0;
    this.chikouSpan = 0;
  }

  /** It reads the high and low of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateOhlc(bar.high, bar.low, bar.close);
  }

  /** @returns the Tenkan-sen */
  updateOhlc(high: number, low: number, close: number): number {
    if (AbstractRTIndicator.isPoison(high) || AbstractRTIndicator.isPoison(low) || AbstractRTIndicator.isPoison(close)) {
      return this.getValue();
    }
    const senkouPeriod = this._senkouPeriod;
    let idx: number;
    if (this.count < senkouPeriod) {
      idx = this.count;
      this.count++;
    } else {
      idx = this.head;
      this.head = (this.head + 1) % senkouPeriod;
    }
    this.highBuffer[idx] = high;
    this.lowBuffer[idx] = low;

    if (this.count >= this._tenkanPeriod) {
      this.tenkanSen = this.midpoint(this._tenkanPeriod);
    }
    if (this.count >= this._kijunPeriod) {
      this.kijunSen = this.midpoint(this._kijunPeriod);
    }
    if (this.count >= this._kijunPeriod) {
      this.senkouSpanA = (this.tenkanSen + this.kijunSen) / 2.0;
    }
    if (this.count >= senkouPeriod) {
      this.senkouSpanB = this.midpoint(senkouPeriod);
    }
    this.chikouSpan = close;

    return this.setValue(this.tenkanSen);
  }

  /** Standalone mode: the input is the close, and stands for the high and the low too. */
  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }

  /** (highest high + lowest low) / 2 over the last `periods` entries of the ring buffer. */
  private midpoint(periods: number): number {
    const senkouPeriod = this._senkouPeriod;
    let maxHigh = Number.NEGATIVE_INFINITY;
    let minLow = Number.POSITIVE_INFINITY;
    for (let i = 0; i < periods; i++) {
      const bufIdx =
        this.count < senkouPeriod
          ? this.count - periods + i
          : (this.head - 1 - i + senkouPeriod) % senkouPeriod;
      const h = this.highBuffer[bufIdx];
      const l = this.lowBuffer[bufIdx];
      if (h > maxHigh) maxHigh = h;
      if (l < minLow) minLow = l;
    }
    return (maxHigh + minLow) / 2.0;
  }
}
