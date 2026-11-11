import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

const MAX_PERIOD = 28;

/**
 * Ultimate Oscillator: the buying pressure over the true range, taken over three windows at once,
 *
 * ```
 * BP    = close - min(low, prevClose)
 * TR    = max(high, prevClose) - min(low, prevClose)
 * Avg7  = sum(BP, 7)  / sum(TR, 7)
 * Avg14 = sum(BP, 14) / sum(TR, 14)
 * Avg28 = sum(BP, 28) / sum(TR, 28)
 * UO    = 100 * (4 * Avg7 + 2 * Avg14 + Avg28) / 7
 * ```
 *
 * From 0 to 100. The first bar only sets the previous close, and the value is 0 until seven bars are in; the class is
 * ready when the window of 28 is full. A bar whose high, low or close is not finite (NaN or an infinity) is left out:
 * nothing is updated and the last value is returned. So is a bar whose buying pressure or true range overflows, which
 * takes a price near the largest double; the previous close stays the reference. The sums and the ratios are not
 * checked: they can make the returned value not finite.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.UltimateOscillatorRTIndicator
 */
export class UltimateOscillatorRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly bpBuffer = new Float64Array(MAX_PERIOD);
  private readonly trBuffer = new Float64Array(MAX_PERIOD);
  private head = 0;
  private count = 0;
  private prevClose = 0;
  private initialized = false;

  override isReady(): boolean {
    return this.count >= MAX_PERIOD;
  }

  override reset(): void {
    super.reset();
    this.head = 0;
    this.count = 0;
    this.prevClose = 0;
    this.initialized = false;
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
    if (!this.initialized) {
      this.prevClose = close;
      this.initialized = true;
      return this.setValue(0);
    }

    const bp = close - Math.min(low, this.prevClose);
    const tr = Math.max(high, this.prevClose) - Math.min(low, this.prevClose);
    if (AbstractRTIndicator.isPoison(bp) || AbstractRTIndicator.isPoison(tr)) {
      return this.getValue();
    }

    let idx: number;
    if (this.count >= MAX_PERIOD) {
      idx = this.head;
      this.head = (this.head + 1) % MAX_PERIOD;
    } else {
      idx = this.count;
      this.count++;
    }

    this.bpBuffer[idx] = bp;
    this.trBuffer[idx] = tr;
    this.prevClose = close;

    if (this.count < 7) {
      return this.setValue(0);
    }

    // The oldest slot is at head; the position from the end tells which windows a value belongs to
    let bpSum7 = 0;
    let trSum7 = 0;
    let bpSum14 = 0;
    let trSum14 = 0;
    let bpSum28 = 0;
    let trSum28 = 0;
    const n = Math.min(this.count, MAX_PERIOD);
    for (let i = 0; i < n; i++) {
      const bi = (this.head + i) % MAX_PERIOD;
      const posFromEnd = n - 1 - i;
      const bpVal = this.bpBuffer[bi];
      const trVal = this.trBuffer[bi];
      if (posFromEnd < 7) {
        bpSum7 += bpVal;
        trSum7 += trVal;
      }
      if (posFromEnd < 14) {
        bpSum14 += bpVal;
        trSum14 += trVal;
      }
      bpSum28 += bpVal;
      trSum28 += trVal;
    }

    const avg7 = trSum7 !== 0 ? bpSum7 / trSum7 : 0;
    const avg14 = trSum14 !== 0 ? bpSum14 / trSum14 : 0;
    const avg28 = trSum28 !== 0 ? bpSum28 / trSum28 : 0;

    const uo = (100.0 * (4.0 * avg7 + 2.0 * avg14 + avg28)) / 7.0;
    return this.setValue(uo);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}
