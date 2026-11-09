import { AbstractRTIndicator, SmaRTIndicator } from "@qtsurfer/indicators";
import { RocRTIndicator } from "./RocRTIndicator";

const DEFAULT_ROC_PERIODS: readonly number[] = [10, 15, 20, 30];
const DEFAULT_SMA_PERIODS: readonly number[] = [10, 10, 10, 15];
const DEFAULT_WEIGHTS: readonly number[] = [1, 2, 3, 4];
const DEFAULT_SIGNAL_PERIOD = 9;

/** What Java's `ArrayIndexOutOfBoundsException` says. */
function outOfBounds(index: number, length: number): RangeError {
  return new RangeError(`Index ${index} out of bounds for length ${length}`);
}

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
 * change) and the period of the signal. Nothing checks the arrays: as in Java, an array of average periods shorter
 * than the one of the rates of change fails in the constructor, and an array of weights shorter than it fails at the
 * first tick, with Java's message for an index out of bounds (`RangeError` here); a longer one is not read past its
 * first entries. The arrays are kept as they are given, not copied.
 * A value that is not finite is not left out, as in the Java class: it goes into the rates of change. The averages
 * and the signal leave out what they cannot take (the free indicators hold their last value for a value that is not
 * finite), so the KST itself stays finite.
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
    this.weights = weights;
    for (let i = 0; i < rocPeriods.length; i++) {
      this.rocs.push(new RocRTIndicator(rocPeriods[i]));
      if (i >= smaPeriods.length) throw outOfBounds(i, smaPeriods.length);
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
    let kst = 0;
    for (let i = 0; i < this.rocs.length; i++) {
      const roc = this.rocs[i].update(newValue);
      const smoothed = this.smas[i].update(roc);
      if (i >= this.weights.length) throw outOfBounds(i, this.weights.length);
      kst += smoothed * this.weights[i];
    }
    this.signal = this.signalSma.update(kst);
    return this.setValue(kst);
  }
}
