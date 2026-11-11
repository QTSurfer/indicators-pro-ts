import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

const FAST_PERIOD = 34;
const SLOW_PERIOD = 55;
const SIGNAL_PERIOD = 13;

/**
 * Klinger Volume Oscillator: volume weighted by the trend of the price, as the gap between a fast and a slow EMA,
 *
 * ```
 * trend = 1 if (high + low + close) >= the same sum of the bar before, else -1
 * dm    = high - low
 * cm    = dm if the trend changed, else the previous cm + dm
 * VF    = volume * |2 * dm / cm - 1| * trend * 100
 * KVO   = EMA(VF, 34) - EMA(VF, 55)
 * ```
 *
 * The value is the KVO; `getSignal` gives its 13-period EMA, the signal line. The EMAs start from the first VF, and the
 * class is ready after 56 bars. A bar whose high, low, close or volume is not finite (NaN or an infinity) is left out:
 * nothing is updated, the last value is returned and the signal keeps its last value. So is a bar whose sum, range,
 * volume force, KVO or signal is not finite, which takes a price or a volume near the largest double: the running range
 * and the EMAs would never recover.
 * Port of com.wualabs.qtsurfer.engine.indicators.volume.pro.KlingerOscillatorRTIndicator
 */
export class KlingerOscillatorRTIndicator extends AbstractRTIndicator implements RTIndicatorSource<Kline | Ticker> {
  private readonly fastAlpha = 2.0 / (FAST_PERIOD + 1);
  private readonly slowAlpha = 2.0 / (SLOW_PERIOD + 1);
  private readonly signalAlpha = 2.0 / (SIGNAL_PERIOD + 1);

  private prevHlc = 0;
  private prevTrend = 0;
  private cm = 0;

  private emaFast = 0;
  private emaSlow = 0;
  private emaSignal = 0;
  private count = 0;
  private signal = 0;

  /** The signal line (an EMA of the KVO), as of the last update. */
  getSignal(): number {
    return this.signal;
  }

  override isReady(): boolean {
    return this.count > SLOW_PERIOD;
  }

  override reset(): void {
    super.reset();
    this.prevHlc = 0;
    this.prevTrend = 0;
    this.cm = 0;
    this.emaFast = 0;
    this.emaSlow = 0;
    this.emaSignal = 0;
    this.count = 0;
    this.signal = 0;
  }

  /** It reads the high, low, close and volume of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    this.updateOhlcv(bar.high, bar.low, bar.close, bar.volume);
  }

  updateOhlcv(high: number, low: number, close: number, volume: number): number {
    if (
      AbstractRTIndicator.isPoison(high) ||
      AbstractRTIndicator.isPoison(low) ||
      AbstractRTIndicator.isPoison(close) ||
      AbstractRTIndicator.isPoison(volume)
    ) {
      return this.getValue();
    }
    const hlc = high + low + close;
    const dm = high - low;
    if (AbstractRTIndicator.isPoison(hlc) || AbstractRTIndicator.isPoison(dm)) {
      return this.getValue();
    }

    if (this.count === 0) {
      this.count = 1;
      this.prevHlc = hlc;
      this.cm = dm;
      this.prevTrend = 1;
      return this.setValue(0);
    }

    const trend = hlc >= this.prevHlc ? 1 : -1;

    const nextCm = trend !== this.prevTrend ? dm : this.cm + dm;

    let vf: number;
    if (nextCm !== 0) {
      vf = volume * Math.abs((2.0 * dm) / nextCm - 1.0) * trend * 100.0;
    } else {
      vf = 0;
    }

    let nextFast: number;
    let nextSlow: number;
    if (this.count === 1) {
      nextFast = vf;
      nextSlow = vf;
    } else {
      nextFast = this.emaFast + this.fastAlpha * (vf - this.emaFast);
      nextSlow = this.emaSlow + this.slowAlpha * (vf - this.emaSlow);
    }

    const kvo = nextFast - nextSlow;
    const nextSignal = this.count === 1 ? kvo : this.emaSignal + this.signalAlpha * (kvo - this.emaSignal);
    if (
      AbstractRTIndicator.isPoison(nextCm) ||
      AbstractRTIndicator.isPoison(vf) ||
      AbstractRTIndicator.isPoison(kvo) ||
      AbstractRTIndicator.isPoison(nextSignal)
    ) {
      return this.getValue();
    }

    this.count++;
    this.prevHlc = hlc;
    this.prevTrend = trend;
    this.cm = nextCm;
    this.emaFast = nextFast;
    this.emaSlow = nextSlow;
    this.emaSignal = nextSignal;
    this.signal = this.emaSignal;

    return this.setValue(kvo);
  }

  override update(newValue: number): number {
    return this.updateOhlcv(newValue, newValue, newValue, 0);
  }
}
