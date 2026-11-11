import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";
import { minimumPeriods } from "$core/Periods";

const FOUR_LN2 = 4.0 * Math.log(2);

/**
 * Parkinson volatility: an estimator from the high-low range, about 5 times as efficient as the
 * close-to-close one. Reads whole bars.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.ParkinsonVolatilityRTIndicator
 */
export class ParkinsonVolatilityRTIndicator
  extends AbstractWindowSeriesRTIndicator
  implements RTIndicatorSource<Kline | Ticker>
{
  private sumLogHLSq = 0;
  private annualizationFactor = 1.0;

  constructor(periods: number) {
    super(minimumPeriods(periods, 1));
  }

  protected override onEvict(evicted: number): void {
    this.sumLogHLSq -= evicted;
  }

  protected override onReset(): void {
    this.sumLogHLSq = 0;
  }

  /** The output is multiplied by this factor. */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The current Parkinson variance (the squared volatility, before annualization). */
  getParkinsonVariance(): number {
    const n = this.window().size;
    if (n === 0) return 0;
    return this.sumLogHLSq / (n * FOUR_LN2);
  }

  /** It reads the high and low of a bar, which a ticker only gives as 24-hour statistics. */
  requiresBarData(): boolean {
    return true;
  }

  updateFrom(source: Kline | Ticker): void {
    const bar = barOf(source);
    if (AbstractRTIndicator.isPoison(bar.high) || AbstractRTIndicator.isPoison(bar.low)) {
      return;
    }
    this.updateHL(bar.high, bar.low);
  }

  /** Not supported: Parkinson needs the high and the low. Use {@link updateHL}. */
  override update(_newValue: number): number {
    throw new Error("Parkinson requires two inputs. Use updateHL(high, low).");
  }

  updateHL(high: number, low: number): number {
    const logHL = Math.log(high / low);
    const logHLSq = logHL * logHL;
    if (AbstractRTIndicator.isPoison(logHLSq)) {
      return this.getValue();
    }
    this.window().add(logHLSq);
    this.sumLogHLSq += logHLSq;

    const n = this.window().size;
    const variance = this.sumLogHLSq / (n * FOUR_LN2);
    return this.setValue(Math.sqrt(variance) * this.annualizationFactor);
  }
}
