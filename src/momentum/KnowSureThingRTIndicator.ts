import { AbstractRTIndicator, SmaRTIndicator } from "@qtsurfer/indicators";
import { javaDouble } from "$core/JavaNumber";
import { RocRTIndicator } from "./RocRTIndicator";

const DEFAULT_ROC_PERIODS: readonly number[] = [10, 15, 20, 30];
const DEFAULT_SMA_PERIODS: readonly number[] = [10, 10, 10, 15];
const DEFAULT_WEIGHTS: readonly number[] = [1, 2, 3, 4];
const DEFAULT_SIGNAL_PERIOD = 9;

/**
 * Know sure thing (KST), Martin Pring's multi-timeframe momentum oscillator: the weighted sum of smoothed rates of
 * change,
 *
 * ```
 * KST    = SMA(ROC(10), 10) * 1 + SMA(ROC(15), 10) * 2 + SMA(ROC(20), 10) * 3 + SMA(ROC(30), 15) * 4
 * signal = SMA(KST, 9)
 * ```
 *
 * The rates of change are the `RocRTIndicator` of this package; the averages are the free `SmaRTIndicator` with its
 * default mode, which refreshes its average once every `periods` ticks and holds it in between. `getSignal` gives the
 * signal line of the last update. The four defaults above are the ones used when no argument is given; the long form
 * takes the periods of the rates of change, the periods of their averages, the weights (one of each per rate of
 * change) and the period of the signal. The weights are copied, so the array given is neither kept nor changed.
 * A value that is not finite (NaN or an infinity) is left out: nothing is updated, the last value is returned and
 * the signal keeps its last value. A rate of change that is an infinity (a base price near zero) is dropped by the
 * guard of the average that reads it.
 * The constructor throws a `RangeError` for an array that is null, an empty array of rates of change,
 * arrays of different lengths, a period of a rate of change or of an average below 1, a weight that is not finite
 * and a `signalPeriod` below 1, checked in this order.
 * Port of com.wualabs.qtsurfer.engine.indicators.momentum.pro.KnowSureThingRTIndicator
 */
export class KnowSureThingRTIndicator extends AbstractRTIndicator {
  private readonly rocs: RocRTIndicator[] = [];
  private readonly smas: SmaRTIndicator[] = [];
  private readonly weights: readonly number[];
  private readonly signalSma: SmaRTIndicator;
  private signal = 0;

  constructor();
  constructor(rocPeriods: readonly number[], smaPeriods: readonly number[], weights: readonly number[], signalPeriod: number);
  constructor(
    rocPeriods: readonly number[] = DEFAULT_ROC_PERIODS,
    smaPeriods: readonly number[] = DEFAULT_SMA_PERIODS,
    weights: readonly number[] = DEFAULT_WEIGHTS,
    signalPeriod: number = DEFAULT_SIGNAL_PERIOD,
  ) {
    super();
    if (rocPeriods == null) {
      throw new RangeError("RocPeriods must not be null");
    }
    if (smaPeriods == null) {
      throw new RangeError("SmaPeriods must not be null");
    }
    if (weights == null) {
      throw new RangeError("Weights must not be null");
    }
    if (rocPeriods.length === 0) {
      throw new RangeError("RocPeriods must not be empty");
    }
    if (smaPeriods.length !== rocPeriods.length || weights.length !== rocPeriods.length) {
      throw new RangeError(
        `RocPeriods, SmaPeriods and Weights must have the same length, got: ${rocPeriods.length}, ${smaPeriods.length} and ${weights.length}`,
      );
    }
    for (let i = 0; i < rocPeriods.length; i++) {
      if (rocPeriods[i] < 1) {
        throw new RangeError(`RocPeriods[${i}] must be >= 1, got: ${rocPeriods[i]}`);
      }
      if (smaPeriods[i] < 1) {
        throw new RangeError(`SmaPeriods[${i}] must be >= 1, got: ${smaPeriods[i]}`);
      }
      if (!Number.isFinite(weights[i])) {
        throw new RangeError(`Weights[${i}] must be finite, got: ${javaDouble(weights[i])}`);
      }
    }
    if (signalPeriod < 1) {
      throw new RangeError(`SignalPeriod must be >= 1, got: ${signalPeriod}`);
    }
    this.weights = weights.slice();
    for (let i = 0; i < rocPeriods.length; i++) {
      this.rocs.push(new RocRTIndicator(rocPeriods[i]));
      this.smas.push(new SmaRTIndicator(smaPeriods[i]));
    }
    this.signalSma = new SmaRTIndicator(signalPeriod);
  }

  /** The signal line: the average of the KST, as of the last update. */
  getSignal(): number {
    return this.signal;
  }

  override isReady(): boolean {
    for (let i = 0; i < this.rocs.length; i++) {
      if (!this.rocs[i].isReady() || !this.smas[i].isReady()) {
        return false;
      }
    }
    return this.signalSma.isReady();
  }

  override reset(): void {
    super.reset();
    for (let i = 0; i < this.rocs.length; i++) {
      this.rocs[i].reset();
      this.smas[i].reset();
    }
    this.signalSma.reset();
    this.signal = 0;
  }

  override update(newValue: number): number {
    if (AbstractRTIndicator.isPoison(newValue)) {
      return this.getValue();
    }
    let kst = 0;
    for (let i = 0; i < this.rocs.length; i++) {
      const roc = this.rocs[i].update(newValue);
      const smoothed = this.smas[i].update(roc);
      kst += smoothed * this.weights[i];
    }
    this.signal = this.signalSma.update(kst);
    return this.setValue(kst);
  }
}
