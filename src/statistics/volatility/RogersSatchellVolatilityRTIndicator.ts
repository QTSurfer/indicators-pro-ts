import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";
import { minimumPeriods } from "$core/Periods";

/**
 * Rogers-Satchell volatility: an estimator from the whole bar that stays unbiased when the price has
 * a drift. Reads whole bars.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.RogersSatchellVolatilityRTIndicator
 */
export class RogersSatchellVolatilityRTIndicator
  extends AbstractWindowSeriesRTIndicator
  implements RTIndicatorSource<Kline | Ticker>
{
  private sumRS = 0;
  private annualizationFactor = 1.0;

  constructor(periods: number) {
    super(minimumPeriods(periods, 1));
  }

  protected override onEvict(evicted: number): void {
    this.sumRS -= evicted;
  }

  protected override onReset(): void {
    this.sumRS = 0;
  }

  /** The output is multiplied by this factor. */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The current Rogers-Satchell variance (the squared volatility, before annualization). */
  getRogersSatchellVariance(): number {
    const n = this.window().size;
    if (n === 0) return 0;
    return this.sumRS / n;
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

  /** Not supported: Rogers-Satchell needs four prices. Use {@link updateOhlc}. */
  override update(_newValue: number): number {
    throw new Error("Rogers-Satchell requires four inputs. Use updateOhlc(open, high, low, close).");
  }

  updateOhlc(open: number, high: number, low: number, close: number): number {
    const logHC = Math.log(high / close);
    const logHO = Math.log(high / open);
    const logLC = Math.log(low / close);
    const logLO = Math.log(low / open);
    const rs = logHC * logHO + logLC * logLO;
    if (AbstractRTIndicator.isPoison(rs)) {
      return this.getValue();
    }
    this.window().add(rs);
    this.sumRS += rs;

    const n = this.window().size;
    const variance = this.sumRS / n;
    return this.setValue(Math.sqrt(Math.max(0, variance)) * this.annualizationFactor);
  }
}
