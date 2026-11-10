import type { Kline, Ticker } from "@qtsurfer/core";
import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator, AtrRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";
import { javaDouble } from "$core/JavaNumber";

/**
 * Chande Kroll Stop: a stop built on the ATR and on the extremes of the close,
 *
 * ```
 * firstHighStop = highest(close, stopPeriod) - ATR(atrPeriod) * multiplier
 * firstLowStop  = lowest(close, stopPeriod)  + ATR(atrPeriod) * multiplier
 * stopShort     = highest(firstHighStop, finalPeriod)
 * stopLong      = lowest(firstLowStop, finalPeriod)
 * ```
 *
 * The value is `stopLong`, the trailing stop of a long position; `getStopShort` gives the one of a short position. A
 * bar whose high, low or close is not finite (NaN or an infinity) is left out: nothing is updated, the last value is
 * returned and the short stop keeps its last value. So is a bar whose first stops are not finite, which takes a close
 * or an `ATR * multiplier` that overflows: the ATR and the window of the closes have taken the bar, the windows of the
 * stops and both stops stay as they were. The constructor throws a `RangeError` for an `atrPeriod`, `stopPeriod` or
 * `finalPeriod` below 1 and for a `multiplier` that is negative or not finite (0 is accepted: both stops then sit on the
 * highest and the lowest close).
 * Port of com.wualabs.qtsurfer.engine.indicators.trend.pro.ChandeKrollStopRTIndicator
 */
export class ChandeKrollStopRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly _atrPeriod: number;
  private readonly _multiplier: number;
  private readonly _stopPeriod: number;
  private readonly _finalPeriod: number;

  private readonly atr: AtrRTIndicator;
  private readonly closeWindow: WindowSeriesStore;
  private readonly firstHighStopWindow: WindowSeriesStore;
  private readonly firstLowStopWindow: WindowSeriesStore;

  private stopShort = 0;
  private stopLong = 0;

  constructor();
  constructor(atrPeriod: number, multiplier: number, stopPeriod: number, finalPeriod: number);
  constructor(atrPeriod: number = 10, multiplier: number = 1.0, stopPeriod: number = 9, finalPeriod: number = 9) {
    super();
    if (atrPeriod < 1) {
      throw new RangeError(`AtrPeriod must be >= 1, got: ${atrPeriod}`);
    }
    if (!(multiplier >= 0) || !Number.isFinite(multiplier)) {
      throw new RangeError(`Multiplier must be finite and >= 0, got: ${javaDouble(multiplier)}`);
    }
    if (stopPeriod < 1) {
      throw new RangeError(`StopPeriod must be >= 1, got: ${stopPeriod}`);
    }
    if (finalPeriod < 1) {
      throw new RangeError(`FinalPeriod must be >= 1, got: ${finalPeriod}`);
    }
    this._atrPeriod = atrPeriod;
    this._multiplier = multiplier;
    this._stopPeriod = stopPeriod;
    this._finalPeriod = finalPeriod;
    this.atr = new AtrRTIndicator(atrPeriod);
    this.closeWindow = new WindowSeriesStore(stopPeriod);
    this.firstHighStopWindow = new WindowSeriesStore(finalPeriod);
    this.firstLowStopWindow = new WindowSeriesStore(finalPeriod);
  }

  getAtrPeriod(): number {
    return this._atrPeriod;
  }

  getMultiplier(): number {
    return this._multiplier;
  }

  getStopPeriod(): number {
    return this._stopPeriod;
  }

  getFinalPeriod(): number {
    return this._finalPeriod;
  }

  /** The stop of a long position, also the main value. */
  getStopLong(): number {
    return this.stopLong;
  }

  /** The stop of a short position, as of the last update. */
  getStopShort(): number {
    return this.stopShort;
  }

  override isReady(): boolean {
    return (
      this.atr.isReady() &&
      this.closeWindow.size === this._stopPeriod &&
      this.firstHighStopWindow.size === this._finalPeriod
    );
  }

  override reset(): void {
    super.reset();
    this.atr.reset();
    this.closeWindow.clear();
    this.firstHighStopWindow.clear();
    this.firstLowStopWindow.clear();
    this.stopShort = 0;
    this.stopLong = 0;
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
    this.atr.updateOhlc(high, low, close);
    const atrVal = this.atr.getValue();

    this.closeWindow.add(close);

    // First stops: highest and lowest close of the stop period, less and plus ATR * multiplier
    const highestClose = highest(this.closeWindow);
    const lowestClose = lowest(this.closeWindow);

    const firstHighStop = highestClose - atrVal * this._multiplier;
    const firstLowStop = lowestClose + atrVal * this._multiplier;
    if (AbstractRTIndicator.isPoison(firstHighStop) || AbstractRTIndicator.isPoison(firstLowStop)) {
      // Only reachable when ATR * multiplier or a close overflows (a huge multiplier, or a price near the largest
      // double): the ATR and the window of the closes have taken the bar; the windows of the stops and both stops
      // stay as they were.
      return this.getValue();
    }

    this.firstHighStopWindow.add(firstHighStop);
    this.firstLowStopWindow.add(firstLowStop);

    // Final stops: highest of the first high stops and lowest of the first low stops over the final period
    this.stopShort = highest(this.firstHighStopWindow);
    this.stopLong = lowest(this.firstLowStopWindow);

    return this.setValue(this.stopLong);
  }

  override update(newValue: number): number {
    return this.updateOhlc(newValue, newValue, newValue);
  }
}

function highest(window: WindowSeriesStore): number {
  let max = Number.NEGATIVE_INFINITY;
  const size = window.size;
  for (let i = 0; i < size; i++) {
    const v = window.getValue(i);
    if (v > max) {
      max = v;
    }
  }
  return size > 0 ? max : 0;
}

function lowest(window: WindowSeriesStore): number {
  let min = Number.POSITIVE_INFINITY;
  const size = window.size;
  for (let i = 0; i < size; i++) {
    const v = window.getValue(i);
    if (v < min) {
      min = v;
    }
  }
  return size > 0 ? min : 0;
}
