import type { Kline, Ticker } from "@qtsurfer/core";
import { WindowSeriesStore } from "@qtsurfer/core";
import { AbstractRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

/** A window that hands each value it evicts to a callback: one class for every instance. */
class EvictingWindow extends WindowSeriesStore {
  constructor(
    size: number,
    private readonly evicted: (value: number) => void,
  ) {
    super(size);
  }

  protected override onRollingWindow(firstValue: number): void {
    this.evicted(firstValue);
  }
}

/**
 * Yang-Zhang volatility: the most efficient OHLC estimator. It combines the overnight variance, the
 * open-to-close variance and the Rogers-Satchell variance with an optimal weight. The first bar only
 * sets the previous close. Reads whole bars.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.YangZhangVolatilityRTIndicator
 */
export class YangZhangVolatilityRTIndicator
  extends AbstractRTIndicator
  implements RTIndicatorSource<Kline | Ticker>
{
  private readonly windowO: EvictingWindow;
  private readonly windowC: EvictingWindow;
  private readonly windowRS: EvictingWindow;
  private sumO = 0;
  private sumOSq = 0;
  private sumC = 0;
  private sumCSq = 0;
  private sumRS = 0;
  private prevClose = 0;
  private hasPrevClose = false;
  private annualizationFactor = 1.0;

  constructor(private readonly _periods: number) {
    super();
    if (_periods < 2) {
      throw new RangeError(`Periods must be >= 2, got: ${_periods}`);
    }
    this.windowO = new EvictingWindow(_periods, (evicted) => {
      this.sumO -= evicted;
      this.sumOSq -= evicted * evicted;
    });
    this.windowC = new EvictingWindow(_periods, (evicted) => {
      this.sumC -= evicted;
      this.sumCSq -= evicted * evicted;
    });
    this.windowRS = new EvictingWindow(_periods, (evicted) => {
      this.sumRS -= evicted;
    });
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.windowO.size === this._periods;
  }

  /** The output is multiplied by this factor. */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The current Yang-Zhang variance (the squared volatility, before annualization). */
  getYangZhangVariance(): number {
    const n = this.windowO.size;
    if (n < 2) return 0;
    const k = 0.34 / (1.34 + (n + 1) / (n - 1));
    const varO = sampleVariance(this.sumO, this.sumOSq, n);
    const varC = sampleVariance(this.sumC, this.sumCSq, n);
    const varRS = this.sumRS / n;
    return varO + k * varC + (1 - k) * varRS;
  }

  /** It reads the open, high, low and close of a bar, which a ticker only gives as statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    if (
      AbstractRTIndicator.isPoison(bar.open) ||
      AbstractRTIndicator.isPoison(bar.high) ||
      AbstractRTIndicator.isPoison(bar.low) ||
      AbstractRTIndicator.isPoison(bar.close)
    ) {
      return;
    }
    this.updateOhlc(bar.open, bar.high, bar.low, bar.close);
  }

  /** Not supported: Yang-Zhang needs the four prices of a bar. Use {@link updateOhlc}. */
  override update(_newValue: number): number {
    throw new Error("Yang-Zhang requires four inputs. Use updateOhlc(open, high, low, close).");
  }

  updateOhlc(open: number, high: number, low: number, close: number): number {
    if (!this.hasPrevClose) {
      if (AbstractRTIndicator.isPoison(close)) {
        return this.getValue();
      }
      this.hasPrevClose = true;
      this.prevClose = close;
      return this.setValue(0);
    }

    const oi = Math.log(open / this.prevClose); // overnight return
    const ci = Math.log(close / open); // close-open return
    const logHC = Math.log(high / close);
    const logHO = Math.log(high / open);
    const logLC = Math.log(low / close);
    const logLO = Math.log(low / open);
    const rsi = logHC * logHO + logLC * logLO; // Rogers-Satchell

    if (AbstractRTIndicator.isPoison(oi) || AbstractRTIndicator.isPoison(ci) || AbstractRTIndicator.isPoison(rsi)) {
      return this.getValue();
    }
    this.prevClose = close;

    this.windowO.add(oi);
    this.windowC.add(ci);
    this.windowRS.add(rsi);
    this.sumO += oi;
    this.sumOSq += oi * oi;
    this.sumC += ci;
    this.sumCSq += ci * ci;
    this.sumRS += rsi;

    const n = this.windowO.size;
    if (n < 2) {
      return this.setValue(0);
    }

    const k = 0.34 / (1.34 + (n + 1) / (n - 1));
    const varO = sampleVariance(this.sumO, this.sumOSq, n);
    const varC = sampleVariance(this.sumC, this.sumCSq, n);
    const varRS = this.sumRS / n;
    const variance = varO + k * varC + (1 - k) * varRS;

    return this.setValue(Math.sqrt(Math.max(0, variance)) * this.annualizationFactor);
  }

  override reset(): void {
    super.reset();
    this.windowO.clear();
    this.windowC.clear();
    this.windowRS.clear();
    this.sumO = 0;
    this.sumOSq = 0;
    this.sumC = 0;
    this.sumCSq = 0;
    this.sumRS = 0;
    this.prevClose = 0;
    this.hasPrevClose = false;
  }
}

function sampleVariance(sum: number, sumSq: number, n: number): number {
  // (n * sumSq - sum²) / (n * (n - 1))
  return (n * sumSq - sum * sum) / (n * (n - 1));
}
