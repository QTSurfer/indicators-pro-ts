import { AbstractRTIndicator, EmaRTIndicator } from "@qtsurfer/indicators";

/**
 * Double exponential moving average (DEMA): `2 * EMA(value) - EMA(EMA(value))`. Smoothing twice and subtracting
 * the second from twice the first takes out most of the lag of a plain EMA. Two EMAs of the same period keep
 * the state, so a tick costs the same whatever the history.
 * Port of com.wualabs.qtsurfer.engine.indicators.averages.pro.DemaRTIndicator
 */
export class DemaRTIndicator extends AbstractRTIndicator {
  private readonly ema1: EmaRTIndicator;
  private readonly ema2: EmaRTIndicator;

  constructor(periods: number) {
    super();
    this.ema1 = new EmaRTIndicator(periods);
    this.ema2 = new EmaRTIndicator(periods);
  }

  override isReady(): boolean {
    return this.ema2.isReady();
  }

  override reset(): void {
    super.reset();
    this.ema1.reset();
    this.ema2.reset();
  }

  override update(newValue: number): number {
    const e1 = this.ema1.update(newValue);
    const e2 = this.ema2.update(e1);
    return this.setValue(2 * e1 - e2);
  }
}
