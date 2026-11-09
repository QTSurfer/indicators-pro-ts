import type { Kline, Ticker } from "@qtsurfer/core";
import { AbstractRTIndicator, AbstractWindowSeriesRTIndicator, type RTIndicatorSource } from "@qtsurfer/indicators";
import { barOf } from "$core/Bar";

const COEFF_CO = 2.0 * Math.log(2) - 1.0;

/**
 * Garman-Klass volatility: an estimator from the whole bar (open, high, low, close), about 7 times as
 * efficient as the close-to-close one. Reads whole bars.
 * Port of com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.GarmanKlassVolatilityRTIndicator
 */
export class GarmanKlassVolatilityRTIndicator
  extends AbstractWindowSeriesRTIndicator
  implements RTIndicatorSource<Kline | Ticker>
{
  private sumGK = 0;
  private annualizationFactor = 1.0;

  constructor(periods: number) {
    super(periods);
  }

  protected override onEvict(evicted: number): void {
    this.sumGK -= evicted;
  }

  protected override onReset(): void {
    this.sumGK = 0;
  }

  /** The output is multiplied by this factor. */
  withAnnualizationFactor(factor: number): this {
    this.annualizationFactor = factor;
    return this;
  }

  /** The current Garman-Klass variance (the squared volatility, before annualization). */
  getGarmanKlassVariance(): number {
    const n = this.window().size;
    if (n === 0) return 0;
    return this.sumGK / n;
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

  /** Not supported: Garman-Klass needs four prices. Use {@link updateOhlc}. */
  override update(_newValue: number): number {
    throw new Error("Garman-Klass requires four inputs. Use updateOhlc(open, high, low, close).");
  }

  updateOhlc(open: number, high: number, low: number, close: number): number {
    const logHL = Math.log(high / low);
    const logCO = Math.log(close / open);
    const gk = 0.5 * logHL * logHL - COEFF_CO * logCO * logCO;
    if (AbstractRTIndicator.isPoison(gk)) {
      return this.getValue();
    }
    this.window().add(gk);
    this.sumGK += gk;

    const n = this.window().size;
    const variance = this.sumGK / n;
    return this.setValue(Math.sqrt(Math.max(0, variance)) * this.annualizationFactor);
  }
}
