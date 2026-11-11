import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * Chande momentum oscillator (CMO): the gains less the losses of the last `periods` price changes, over their sum,
 * in percent,
 *
 * ```
 * CMO = (sumGain - sumLoss) / (sumGain + sumLoss) * 100
 * ```
 *
 * It runs between -100 and +100 and is like the RSI, but uses the difference of the gains and the losses and not an
 * average of each. A ring buffer of the changes keeps the two running sums, so a tick costs the same whatever the
 * history. 0 on the first price, and 0 while the sum of gains and losses is 0. 14 periods when no argument is given.
 * A value that is not finite (NaN or an infinity) is left out: nothing is updated and the last value is returned. So
 * is a price whose change from the last one overflows (prices near `Number.MAX_VALUE`), and the last price stays the
 * reference. The constructor throws a `RangeError` for `periods` below 1.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.CmoRTIndicator
 */
export class CmoRTIndicator extends AbstractRTIndicator {
  private readonly _periods: number;
  private readonly changes: Float64Array; // positive = gain, negative = loss
  private head = 0;
  private count = 0;
  private prevValue = 0;
  private sumGain = 0;
  private sumLoss = 0;
  private initialized = false;

  constructor(periods = 14) {
    super();
    if (periods < 1) {
      throw new RangeError(`Periods must be >= 1, got: ${periods}`);
    }
    this._periods = periods;
    this.changes = new Float64Array(periods);
  }

  get periods(): number {
    return this._periods;
  }

  override isReady(): boolean {
    return this.count >= this._periods;
  }

  override reset(): void {
    super.reset();
    this.head = 0;
    this.count = 0;
    this.prevValue = 0;
    this.sumGain = 0;
    this.sumLoss = 0;
    this.initialized = false;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    if (!this.initialized) {
      this.prevValue = newValue;
      this.initialized = true;
      return this.setValue(0);
    }

    const change = newValue - this.prevValue;
    if (AbstractRTIndicator.isPoison(change)) {
      // Only reachable when the difference overflows (|price| near Number.MAX_VALUE): hold, and keep the previous
      // price as the reference.
      return this.getValue();
    }
    this.prevValue = newValue;

    // Evict the oldest
    if (this.count >= this._periods) {
      const evicted = this.changes[this.head];
      if (evicted > 0) this.sumGain -= evicted;
      else if (evicted < 0) this.sumLoss -= -evicted;
      this.changes[this.head] = change;
      this.head = (this.head + 1) % this._periods;
    } else {
      this.changes[this.count] = change;
      this.count++;
    }

    if (change > 0) this.sumGain += change;
    else if (change < 0) this.sumLoss += -change;

    const total = this.sumGain + this.sumLoss;
    return this.setValue(total !== 0 ? ((this.sumGain - this.sumLoss) / total) * 100 : 0);
  }
}
