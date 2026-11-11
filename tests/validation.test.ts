import { describe, expect, it } from "vitest";
import { AlmaRTIndicator } from "$averages/AlmaRTIndicator";
import { DemaRTIndicator } from "$averages/DemaRTIndicator";
import { EnvelopesRTIndicator } from "$averages/EnvelopesRTIndicator";
import { FramaRTIndicator } from "$averages/FramaRTIndicator";
import { LeastSquaresMovingAverageRTIndicator } from "$averages/LeastSquaresMovingAverageRTIndicator";
import { McGinleyDynamicRTIndicator } from "$averages/McGinleyDynamicRTIndicator";
import { AdaptiveFisherTransformRTIndicator } from "$momentum/AdaptiveFisherTransformRTIndicator";
import { ChandeForecastOscillatorRTIndicator } from "$momentum/ChandeForecastOscillatorRTIndicator";
import { CmoRTIndicator } from "$momentum/CmoRTIndicator";
import { ConnorsRsiRTIndicator } from "$momentum/ConnorsRsiRTIndicator";
import { CoppockCurveRTIndicator } from "$momentum/CoppockCurveRTIndicator";
import { DetrendedPriceOscillatorRTIndicator } from "$momentum/DetrendedPriceOscillatorRTIndicator";
import { FisherTransformRTIndicator } from "$momentum/FisherTransformRTIndicator";
import { KnowSureThingRTIndicator } from "$momentum/KnowSureThingRTIndicator";
import { MomentumRTIndicator } from "$momentum/MomentumRTIndicator";
import { RocRTIndicator } from "$momentum/RocRTIndicator";
import { TrixRTIndicator } from "$momentum/TrixRTIndicator";
import { TrueStrengthIndexRTIndicator } from "$momentum/TrueStrengthIndexRTIndicator";
import { CalmarRatioRTIndicator } from "$statistics/ratios/CalmarRatioRTIndicator";
import { MaxDrawdownRTIndicator } from "$statistics/ratios/MaxDrawdownRTIndicator";
import { OmegaRatioRTIndicator } from "$statistics/ratios/OmegaRatioRTIndicator";
import { SharpeRatioRTIndicator } from "$statistics/ratios/SharpeRatioRTIndicator";
import { SortinoRatioRTIndicator } from "$statistics/ratios/SortinoRatioRTIndicator";
import { TailRatioRTIndicator } from "$statistics/ratios/TailRatioRTIndicator";
import { UlcerIndexRTIndicator } from "$statistics/ratios/UlcerIndexRTIndicator";
import { EwmaVolatilityRTIndicator } from "$statistics/volatility/EwmaVolatilityRTIndicator";
import { RealizedVolatilityRTIndicator } from "$statistics/volatility/RealizedVolatilityRTIndicator";
import { reference } from "./fixtures";

// The guards of the constructors and of the options, with the messages of the Java engine (a number with no
// decimal part is the one difference: Java prints a double as 1.0), and reset(): none of them is reached by the
// series of parity.test.ts.

describe("the guards of the constructors", () => {
  it.each([
    ["Calmar", (periods: number) => new CalmarRatioRTIndicator(periods), 2],
    ["Omega", (periods: number) => new OmegaRatioRTIndicator(periods), 2],
    ["Sharpe", (periods: number) => new SharpeRatioRTIndicator(periods), 2],
    ["Sortino", (periods: number) => new SortinoRatioRTIndicator(periods), 2],
    ["Tail", (periods: number) => new TailRatioRTIndicator(periods), 2],
    ["Ulcer", (periods: number) => new UlcerIndexRTIndicator(periods), 1],
  ] as const)("%s takes no fewer periods than %d, and says so", (_, make, minimum) => {
    expect(() => make(minimum - 1)).toThrow(new RangeError(`Periods must be >= ${minimum}, got: ${minimum - 1}`));
    expect(() => make(minimum)).not.toThrow();
  });

  it("Sharpe and Realized build their window first: a window of no periods fails with the window's message", () => {
    expect(() => new SharpeRatioRTIndicator(0)).toThrow(new RangeError("Invalid 0 windowSize"));
    expect(() => new RealizedVolatilityRTIndicator(0)).toThrow(new RangeError("Invalid 0 windowSize"));
    expect(() => new RealizedVolatilityRTIndicator(-3)).toThrow(new RangeError("Invalid -3 windowSize"));
  });

  it("Realized volatility has no minimum beyond a window of one", () => {
    const realized = new RealizedVolatilityRTIndicator(1);
    realized.update(100);
    expect(realized.update(101)).toBe(0);
  });

  it("Ewma takes a lambda in (0, 1), 0.94 when omitted", () => {
    expect(new EwmaVolatilityRTIndicator().getLambda()).toBe(0.94);
    expect(new EwmaVolatilityRTIndicator(0.97).getLambda()).toBe(0.97);
    // the message of a value with no decimal part (0, 1) is printed 0.0 and 1.0 by Java, 0 and 1 here
    expect(() => new EwmaVolatilityRTIndicator(0)).toThrow(RangeError);
    expect(() => new EwmaVolatilityRTIndicator(1)).toThrow(RangeError);
    expect(() => new EwmaVolatilityRTIndicator(-0.5)).toThrow(new RangeError("Lambda must be in (0, 1), got: -0.5"));
    expect(() => new EwmaVolatilityRTIndicator(1.5)).toThrow(new RangeError("Lambda must be in (0, 1), got: 1.5"));
  });

  it("Ewma lets NaN through, as Java's comparisons do", () => {
    expect(new EwmaVolatilityRTIndicator(NaN).getLambda()).toBeNaN();
  });
});

/** The construction throws a `RangeError` with exactly this message (the class is checked too: `toThrow(error)` compares the message only). */
function rejects(message: string, construct: () => unknown): void {
  let thrown: unknown;
  try {
    construct();
  } catch (error) {
    thrown = error;
  }
  expect(thrown, message).toBeInstanceOf(RangeError);
  expect((thrown as RangeError).message).toBe(message);
}

const SHORT_SERIES = [
  100, 101.5, 99.25, 102, 104.5, 103, 101, 100.5, 105, 107, 106, 108.25, 104, 102.5, 103.75, 109, 111, 110, 108, 107.5, 106, 105, 109.5, 112,
  113.25, 111, 110.5, 114, 116, 115,
];

/** The value is accepted: the instance builds and 30 ticks leave every value finite. */
function accepts<T extends { update(price: number): number }>(construct: () => T): T {
  const indicator = construct();
  for (const price of SHORT_SERIES) expect(Number.isFinite(indicator.update(price))).toBe(true);
  return indicator;
}

const none = null as unknown as number[];

// The limits of the constructors, with the messages of the Java engine: `<Parameter> must be <rule>, got: <value>`, a
// double written as Java writes it (`1.0E200`, `-6.0`, `NaN`) and an int as it is. The first check that fails speaks.

describe("the limits of the constructors of the averages and the momentum indicators", () => {
  it("ALMA", () => {
    accepts(() => new AlmaRTIndicator(1));
    accepts(() => new AlmaRTIndicator(5, 0.0, 6.0));
    accepts(() => new AlmaRTIndicator(5, 1.0, 6.0));
    accepts(() => new AlmaRTIndicator(5, 0.5, Number.MIN_VALUE)); // a huge sigma: flat weights
    rejects("Periods must be >= 1, got: 0", () => new AlmaRTIndicator(0));
    rejects("Periods must be >= 1, got: -1", () => new AlmaRTIndicator(-1));
    rejects("Periods must be >= 1, got: 0", () => new AlmaRTIndicator(0, 0.85, 6.0));
    rejects("OffsetFactor must be in [0, 1], got: -0.1", () => new AlmaRTIndicator(5, -0.1, 6.0));
    rejects("OffsetFactor must be in [0, 1], got: 1.1", () => new AlmaRTIndicator(5, 1.1, 6.0));
    rejects("OffsetFactor must be in [0, 1], got: NaN", () => new AlmaRTIndicator(5, NaN, 6.0));
    rejects("OffsetFactor must be in [0, 1], got: Infinity", () => new AlmaRTIndicator(5, Infinity, 6.0));
    rejects("SigmaFactor must be finite and > 0, got: 0.0", () => new AlmaRTIndicator(5, 0.85, 0));
    rejects("SigmaFactor must be finite and > 0, got: -6.0", () => new AlmaRTIndicator(5, 0.85, -6));
    rejects("SigmaFactor must be finite and > 0, got: NaN", () => new AlmaRTIndicator(5, 0.85, NaN));
    rejects("SigmaFactor must be finite and > 0, got: Infinity", () => new AlmaRTIndicator(5, 0.85, Infinity));
    rejects("SigmaFactor must be finite and > 0, got: -Infinity", () => new AlmaRTIndicator(5, 0.85, -Infinity));
    // sigma^2 underflows to 0: the peak weight would be exp(0/0), NaN, and the value NaN for good
    rejects("SigmaFactor is too large for 10 periods, got: 1.0E200", () => new AlmaRTIndicator(10, 0.85, 1e200));
  });

  it("ALMA checks the periods, then the offset factor, then the sigma factor, then the underflow", () => {
    rejects("Periods must be >= 1, got: 0", () => new AlmaRTIndicator(0, NaN, NaN));
    rejects("OffsetFactor must be in [0, 1], got: 2.0", () => new AlmaRTIndicator(5, 2, -1));
    rejects("SigmaFactor must be finite and > 0, got: 0.0", () => new AlmaRTIndicator(5, 0.5, 0));
    rejects("SigmaFactor is too large for 5 periods, got: 1.0E300", () => new AlmaRTIndicator(5, 0.5, 1e300));
  });

  it("DEMA", () => {
    accepts(() => new DemaRTIndicator(1));
    rejects("Periods must be >= 1, got: 0", () => new DemaRTIndicator(0));
    rejects("Periods must be >= 1, got: -1", () => new DemaRTIndicator(-1));
  });

  it("Envelopes", () => {
    accepts(() => new EnvelopesRTIndicator(1, 2.5));
    const zero = accepts(() => new EnvelopesRTIndicator(5, 0));
    expect(zero.getUpper()).toBe(zero.getValue());
    expect(zero.getLower()).toBe(zero.getValue());
    rejects("Periods must be >= 1, got: 0", () => new EnvelopesRTIndicator(0, 2.5));
    rejects("Periods must be >= 1, got: -2", () => new EnvelopesRTIndicator(-2, 2.5));
    rejects("Percentage must be finite and >= 0, got: -0.5", () => new EnvelopesRTIndicator(5, -0.5));
    rejects("Percentage must be finite and >= 0, got: NaN", () => new EnvelopesRTIndicator(5, NaN));
    rejects("Percentage must be finite and >= 0, got: Infinity", () => new EnvelopesRTIndicator(5, Infinity));
    rejects("Percentage must be finite and >= 0, got: -Infinity", () => new EnvelopesRTIndicator(5, -Infinity));
    rejects("Periods must be >= 1, got: 0", () => new EnvelopesRTIndicator(0, NaN));
  });

  it("FRAMA checks the periods as given, and makes an odd number even afterwards", () => {
    accepts(() => new FramaRTIndicator(4));
    expect(accepts(() => new FramaRTIndicator(3)).periods).toBe(4);
    expect(accepts(() => new FramaRTIndicator(11)).periods).toBe(12);
    expect(new FramaRTIndicator().periods).toBe(20);
    expect(new FramaRTIndicator(7).periods).toBe(8);
    expect(new FramaRTIndicator(8).periods).toBe(8);
    for (const periods of [2, 1, 0, -1, -4]) {
      rejects(`Periods must be >= 3, got: ${periods}`, () => new FramaRTIndicator(periods));
    }
  });

  it("LSMA", () => {
    accepts(() => new LeastSquaresMovingAverageRTIndicator(2));
    rejects("Periods must be >= 2, got: 1", () => new LeastSquaresMovingAverageRTIndicator(1));
    rejects("Periods must be >= 2, got: 0", () => new LeastSquaresMovingAverageRTIndicator(0));
    rejects("Periods must be >= 2, got: -3", () => new LeastSquaresMovingAverageRTIndicator(-3));
  });

  it("McGinley Dynamic", () => {
    accepts(() => new McGinleyDynamicRTIndicator(1));
    rejects("Periods must be >= 1, got: 0", () => new McGinleyDynamicRTIndicator(0));
    rejects("Periods must be >= 1, got: -3", () => new McGinleyDynamicRTIndicator(-3));
  });

  it("Momentum, ROC and CMO", () => {
    for (const make of [(p: number) => new MomentumRTIndicator(p), (p: number) => new RocRTIndicator(p), (p: number) => new CmoRTIndicator(p)]) {
      accepts(() => make(1));
      rejects("Periods must be >= 1, got: 0", () => make(0));
      rejects("Periods must be >= 1, got: -1", () => make(-1));
    }
  });

  it("DPO", () => {
    accepts(() => new DetrendedPriceOscillatorRTIndicator(3));
    for (const periods of [2, 1, 0, -5]) {
      rejects(`Periods must be >= 3, got: ${periods}`, () => new DetrendedPriceOscillatorRTIndicator(periods));
    }
  });

  it("the Chande forecast oscillator", () => {
    accepts(() => new ChandeForecastOscillatorRTIndicator(2));
    for (const periods of [1, 0, -1]) {
      rejects(`Periods must be >= 2, got: ${periods}`, () => new ChandeForecastOscillatorRTIndicator(periods));
    }
  });

  it("Connors RSI", () => {
    accepts(() => new ConnorsRsiRTIndicator(1, 1, 2));
    rejects("RsiPeriod must be >= 1, got: 0", () => new ConnorsRsiRTIndicator(0, 2, 20));
    rejects("RsiPeriod must be >= 1, got: -1", () => new ConnorsRsiRTIndicator(-1, 2, 20));
    rejects("StreakRsiPeriod must be >= 1, got: 0", () => new ConnorsRsiRTIndicator(3, 0, 20));
    rejects("StreakRsiPeriod must be >= 1, got: -2", () => new ConnorsRsiRTIndicator(3, -2, 20));
    rejects("RankPeriod must be >= 2, got: 1", () => new ConnorsRsiRTIndicator(3, 2, 1));
    rejects("RankPeriod must be >= 2, got: 0", () => new ConnorsRsiRTIndicator(3, 2, 0));
    rejects("RankPeriod must be >= 2, got: -4", () => new ConnorsRsiRTIndicator(3, 2, -4));
    // in the order of the parameters
    rejects("RsiPeriod must be >= 1, got: 0", () => new ConnorsRsiRTIndicator(0, 0, 0));
    rejects("StreakRsiPeriod must be >= 1, got: 0", () => new ConnorsRsiRTIndicator(3, 0, 0));
  });

  it("Coppock", () => {
    accepts(() => new CoppockCurveRTIndicator(1, 1, 1));
    rejects("LongRoc must be >= 1, got: 0", () => new CoppockCurveRTIndicator(0, 11, 10));
    rejects("LongRoc must be >= 1, got: -1", () => new CoppockCurveRTIndicator(-1, 11, 10));
    rejects("ShortRoc must be >= 1, got: 0", () => new CoppockCurveRTIndicator(14, 0, 10));
    rejects("ShortRoc must be >= 1, got: -1", () => new CoppockCurveRTIndicator(14, -1, 10));
    rejects("WmaPeriod must be >= 1, got: 0", () => new CoppockCurveRTIndicator(14, 11, 0));
    rejects("WmaPeriod must be >= 1, got: -1", () => new CoppockCurveRTIndicator(14, 11, -1));
    rejects("LongRoc must be >= 1, got: -3", () => new CoppockCurveRTIndicator(-3, -2, 0));
    rejects("ShortRoc must be >= 1, got: -2", () => new CoppockCurveRTIndicator(5, -2, 0));
  });

  it("Fisher", () => {
    accepts(() => new FisherTransformRTIndicator(2));
    for (const periods of [1, 0, -1]) {
      rejects(`Periods must be >= 2, got: ${periods}`, () => new FisherTransformRTIndicator(periods));
    }
  });

  it("the adaptive Fisher", () => {
    accepts(() => new AdaptiveFisherTransformRTIndicator(1, 2, 3)); // erPeriod 1, minPeriod 2, maxPeriod 3
    accepts(() => new AdaptiveFisherTransformRTIndicator(5, 5, 6)); // erPeriod == maxPeriod - 1
    accepts(() => new AdaptiveFisherTransformRTIndicator(2, 5, 5)); // minPeriod == maxPeriod
    rejects("ErPeriod must be >= 1, got: 0", () => new AdaptiveFisherTransformRTIndicator(0, 5, 20));
    rejects("ErPeriod must be >= 1, got: -1", () => new AdaptiveFisherTransformRTIndicator(-1, 5, 20));
    rejects("MinPeriod must be >= 2, got: 1", () => new AdaptiveFisherTransformRTIndicator(10, 1, 20));
    rejects("MinPeriod must be >= 2, got: 0", () => new AdaptiveFisherTransformRTIndicator(10, 0, 20));
    rejects("MinPeriod must be >= 2, got: -3", () => new AdaptiveFisherTransformRTIndicator(10, -3, 20));
    rejects("MinPeriod must be <= MaxPeriod, got: 6 and 5", () => new AdaptiveFisherTransformRTIndicator(2, 6, 5));
    rejects("ErPeriod must be < MaxPeriod, got: 20 and 20", () => new AdaptiveFisherTransformRTIndicator(20, 5, 20));
    rejects("ErPeriod must be < MaxPeriod, got: 21 and 20", () => new AdaptiveFisherTransformRTIndicator(21, 5, 20));
  });

  it("the adaptive Fisher checks erPeriod, then minPeriod, then their order, then erPeriod against maxPeriod", () => {
    rejects("ErPeriod must be >= 1, got: 0", () => new AdaptiveFisherTransformRTIndicator(0, 1, 0));
    rejects("MinPeriod must be >= 2, got: 1", () => new AdaptiveFisherTransformRTIndicator(10, 1, 5));
    // erPeriod is not below maxPeriod here too, but the order of the two periods is checked first
    rejects("MinPeriod must be <= MaxPeriod, got: 6 and 5", () => new AdaptiveFisherTransformRTIndicator(25, 6, 5));
    rejects("ErPeriod must be < MaxPeriod, got: 25 and 20", () => new AdaptiveFisherTransformRTIndicator(25, 6, 20));
  });

  it("KST", () => {
    accepts(() => new KnowSureThingRTIndicator([1], [1], [0], 1));
    const rocs = [3, 4];
    const smas = [2, 3];
    const weights = [1, 2];
    rejects("RocPeriods must not be null", () => new KnowSureThingRTIndicator(none, smas, weights, 3));
    rejects("SmaPeriods must not be null", () => new KnowSureThingRTIndicator(rocs, none, weights, 3));
    rejects("Weights must not be null", () => new KnowSureThingRTIndicator(rocs, smas, none, 3));
    rejects("RocPeriods must not be empty", () => new KnowSureThingRTIndicator([], [], [], 3));
    rejects("RocPeriods, SmaPeriods and Weights must have the same length, got: 2, 1 and 2", () => new KnowSureThingRTIndicator(rocs, [2], weights, 3));
    rejects("RocPeriods, SmaPeriods and Weights must have the same length, got: 2, 3 and 2", () => new KnowSureThingRTIndicator(rocs, [2, 3, 4], weights, 3));
    rejects("RocPeriods, SmaPeriods and Weights must have the same length, got: 2, 2 and 1", () => new KnowSureThingRTIndicator(rocs, smas, [1], 3));
    rejects("RocPeriods[1] must be >= 1, got: 0", () => new KnowSureThingRTIndicator([3, 0], smas, weights, 3));
    rejects("RocPeriods[0] must be >= 1, got: -2", () => new KnowSureThingRTIndicator([-2, 4], smas, weights, 3));
    rejects("SmaPeriods[0] must be >= 1, got: 0", () => new KnowSureThingRTIndicator(rocs, [0, 3], weights, 3));
    rejects("SmaPeriods[1] must be >= 1, got: -1", () => new KnowSureThingRTIndicator(rocs, [2, -1], weights, 3));
    rejects("Weights[0] must be finite, got: NaN", () => new KnowSureThingRTIndicator(rocs, smas, [NaN, 2], 3));
    rejects("Weights[1] must be finite, got: Infinity", () => new KnowSureThingRTIndicator(rocs, smas, [1, Infinity], 3));
    rejects("Weights[1] must be finite, got: -Infinity", () => new KnowSureThingRTIndicator(rocs, smas, [1, -Infinity], 3));
    rejects("SignalPeriod must be >= 1, got: 0", () => new KnowSureThingRTIndicator(rocs, smas, weights, 0));
    rejects("SignalPeriod must be >= 1, got: -1", () => new KnowSureThingRTIndicator(rocs, smas, weights, -1));
  });

  it("KST checks the arrays that are null, then the empty one, then the lengths, then each index, then the signal period", () => {
    rejects("RocPeriods must not be null", () => new KnowSureThingRTIndicator(none, none, none, 0));
    rejects("SmaPeriods must not be null", () => new KnowSureThingRTIndicator([], none, none, 0));
    rejects("Weights must not be null", () => new KnowSureThingRTIndicator([], [], none, 0));
    // an empty array of rates of change is reported before the lengths
    rejects("RocPeriods must not be empty", () => new KnowSureThingRTIndicator([], [1], [1], 0));
    // the lengths are checked before any index
    rejects("RocPeriods, SmaPeriods and Weights must have the same length, got: 2, 1 and 2", () => new KnowSureThingRTIndicator([0, 0], [0], [NaN, NaN], 0));
    // one loop over the index: at an index, the rate of change, then the average, then the weight
    rejects("RocPeriods[0] must be >= 1, got: 0", () => new KnowSureThingRTIndicator([0, 3], [0, 3], [NaN, 2], 0));
    rejects("SmaPeriods[0] must be >= 1, got: 0", () => new KnowSureThingRTIndicator([3, 0], [0, 3], [NaN, 2], 0));
    rejects("Weights[0] must be finite, got: NaN", () => new KnowSureThingRTIndicator([3, 0], [3, 0], [NaN, 2], 0));
    rejects("RocPeriods[1] must be >= 1, got: 0", () => new KnowSureThingRTIndicator([3, 0], [3, 0], [1, NaN], 0));
    // the signal period comes last
    rejects("Weights[1] must be finite, got: Infinity", () => new KnowSureThingRTIndicator([3, 4], [3, 3], [1, Infinity], 0));
    rejects("SignalPeriod must be >= 1, got: 0", () => new KnowSureThingRTIndicator([3, 4], [3, 3], [1, 2], 0));
  });

  it("KST copies the weights: the array given is neither kept nor changed", () => {
    const weights = [1, 2];
    const kst = new KnowSureThingRTIndicator([2, 3], [2, 2], weights, 2);
    const reference = new KnowSureThingRTIndicator([2, 3], [2, 2], [1, 2], 2);
    weights[0] = NaN;
    weights[1] = 1000;
    for (const price of SHORT_SERIES) expect(kst.update(price)).toBe(reference.update(price));
    expect(weights).toEqual([NaN, 1000]);
    const frozen = Object.freeze([1, 2]);
    expect(() => new KnowSureThingRTIndicator([2, 3], [2, 2], frozen, 2)).not.toThrow();
    expect(frozen).toEqual([1, 2]);
  });

  it("TRIX", () => {
    accepts(() => new TrixRTIndicator(1));
    rejects("Periods must be >= 1, got: 0", () => new TrixRTIndicator(0));
    rejects("Periods must be >= 1, got: -1", () => new TrixRTIndicator(-1));
  });

  it("TSI, which the Java class limits too", () => {
    accepts(() => new TrueStrengthIndexRTIndicator(1, 1));
    rejects("LongPeriod must be >= 1, got: 0", () => new TrueStrengthIndexRTIndicator(0, 13));
    rejects("LongPeriod must be >= 1, got: -1", () => new TrueStrengthIndexRTIndicator(-1, 13));
    rejects("ShortPeriod must be >= 1, got: 0", () => new TrueStrengthIndexRTIndicator(25, 0));
    rejects("ShortPeriod must be >= 1, got: -1", () => new TrueStrengthIndexRTIndicator(25, -1));
    rejects("LongPeriod must be >= 1, got: 0", () => new TrueStrengthIndexRTIndicator(0, 0));
  });

  it("the default constructors still build", () => {
    for (const make of [
      () => new EnvelopesRTIndicator(),
      () => new FramaRTIndicator(),
      () => new LeastSquaresMovingAverageRTIndicator(),
      () => new McGinleyDynamicRTIndicator(),
      () => new MomentumRTIndicator(),
      () => new RocRTIndicator(),
      () => new CmoRTIndicator(),
      () => new DetrendedPriceOscillatorRTIndicator(),
      () => new ChandeForecastOscillatorRTIndicator(),
      () => new ConnorsRsiRTIndicator(),
      () => new CoppockCurveRTIndicator(),
      () => new FisherTransformRTIndicator(),
      () => new AdaptiveFisherTransformRTIndicator(),
      () => new KnowSureThingRTIndicator(),
      () => new TrixRTIndicator(),
      () => new TrueStrengthIndexRTIndicator(),
    ]) {
      expect(make).not.toThrow();
    }
  });

  it("the periods are what the constructor was given, and the default of each class is Java's", () => {
    expect([new AlmaRTIndicator(9).periods, new AlmaRTIndicator(9, 0.5, 4.0).periods]).toEqual([9, 9]);
    expect(new LeastSquaresMovingAverageRTIndicator().periods).toBe(25);
    expect(new LeastSquaresMovingAverageRTIndicator(7).periods).toBe(7);
    expect(new McGinleyDynamicRTIndicator().periods).toBe(14);
    expect(new McGinleyDynamicRTIndicator(5).periods).toBe(5);
    expect(new MomentumRTIndicator().periods).toBe(10);
    expect(new MomentumRTIndicator(3).periods).toBe(3);
    expect(new RocRTIndicator().periods).toBe(12);
    expect(new RocRTIndicator(3).periods).toBe(3);
    expect(new CmoRTIndicator().periods).toBe(14);
    expect(new CmoRTIndicator(5).periods).toBe(5);
    expect(new DetrendedPriceOscillatorRTIndicator().periods).toBe(20);
    expect(new DetrendedPriceOscillatorRTIndicator(7).periods).toBe(7);
    expect([new ChandeForecastOscillatorRTIndicator().periods, new ChandeForecastOscillatorRTIndicator(5).periods]).toEqual([14, 5]);
    expect([new FisherTransformRTIndicator().periods, new FisherTransformRTIndicator(5).periods]).toEqual([10, 5]);
    const connors = new ConnorsRsiRTIndicator();
    expect([connors.getRsiPeriod(), connors.getStreakRsiPeriod(), connors.getRankPeriod()]).toEqual([3, 2, 100]);
    const connorsOther = new ConnorsRsiRTIndicator(5, 3, 20);
    expect([connorsOther.getRsiPeriod(), connorsOther.getStreakRsiPeriod(), connorsOther.getRankPeriod()]).toEqual([5, 3, 20]);
    const coppock = new CoppockCurveRTIndicator();
    expect([coppock.getLongRoc(), coppock.getShortRoc(), coppock.getWmaPeriod()]).toEqual([14, 11, 10]);
    const coppockOther = new CoppockCurveRTIndicator(8, 5, 4);
    expect([coppockOther.getLongRoc(), coppockOther.getShortRoc(), coppockOther.getWmaPeriod()]).toEqual([8, 5, 4]);
    expect(new AdaptiveFisherTransformRTIndicator().getErPeriod()).toBe(10);
    expect(new AdaptiveFisherTransformRTIndicator(5, 3, 9).getErPeriod()).toBe(5);
  });

  it("Envelopes is 20 periods and 2.5 percent when built with no argument", () => {
    const byDefault = new EnvelopesRTIndicator();
    const explicit = new EnvelopesRTIndicator(20, 2.5);
    for (const price of reference.inputs.price.slice(0, 60)) {
      expect(byDefault.update(price)).toBe(explicit.update(price));
      expect(byDefault.getUpper()).toBe(explicit.getUpper());
      expect(byDefault.getLower()).toBe(explicit.getLower());
    }
  });

  it("Envelopes puts its bands at the percentage of the middle line", () => {
    const envelopes = new EnvelopesRTIndicator(5, 10);
    for (const price of [100, 100, 100]) envelopes.update(price);
    expect(envelopes.getValue()).toBe(100);
    expect(envelopes.getUpper()).toBeCloseTo(110, 12);
    expect(envelopes.getLower()).toBeCloseTo(90, 12);
  });

  it("the adaptive Fisher starts at its longest window, with no efficiency ratio", () => {
    const adaptive = new AdaptiveFisherTransformRTIndicator();
    expect([adaptive.getAdaptivePeriod(), adaptive.getEfficiencyRatio()]).toEqual([20, 0]);
    expect(new AdaptiveFisherTransformRTIndicator(5, 3, 9).getAdaptivePeriod()).toBe(9);
  });

  it("the classes built with no argument are the long form with Java's defaults", () => {
    const pairs = [
      ["Connors RSI", new ConnorsRsiRTIndicator(), new ConnorsRsiRTIndicator(3, 2, 100)],
      ["Coppock", new CoppockCurveRTIndicator(), new CoppockCurveRTIndicator(14, 11, 10)],
      ["adaptive Fisher", new AdaptiveFisherTransformRTIndicator(), new AdaptiveFisherTransformRTIndicator(10, 5, 20)],
      ["KST", new KnowSureThingRTIndicator(), new KnowSureThingRTIndicator([10, 15, 20, 30], [10, 10, 10, 15], [1, 2, 3, 4], 9)],
      ["TRIX", new TrixRTIndicator(), new TrixRTIndicator(15)],
      ["TSI", new TrueStrengthIndexRTIndicator(), new TrueStrengthIndexRTIndicator(25, 13)],
      ["Fisher", new FisherTransformRTIndicator(), new FisherTransformRTIndicator(10)],
      ["Chande", new ChandeForecastOscillatorRTIndicator(), new ChandeForecastOscillatorRTIndicator(14)],
    ] as const;
    for (const [label, byDefault, explicit] of pairs) {
      for (const price of reference.inputs.price.slice(0, 150)) {
        expect(byDefault.update(price), label).toBe(explicit.update(price));
        expect(byDefault.isReady(), label).toBe(explicit.isReady());
      }
    }
  });
});

describe("the guards of the options", () => {
  it("Tail takes percentiles in (0, 1) and does not check which one is the larger", () => {
    const tail = new TailRatioRTIndicator(20);
    for (const [upper, lower] of [[0, 0.5], [1, 0.5], [0.5, 0], [0.5, 1], [-0.1, 0.5], [0.5, 1.1]]) {
      expect(() => tail.withPercentiles(upper, lower), `${upper} ${lower}`).toThrow(new RangeError("Percentiles must be in (0, 1)"));
    }
    expect(tail.withPercentiles(0.1, 0.9)).toBe(tail);
    expect(() => tail.withPercentiles(NaN, NaN)).not.toThrow();
  });

  it("every with-option returns the indicator, to chain", () => {
    const calmar = new CalmarRatioRTIndicator(20);
    expect(calmar.withAnnualizationFactor(365)).toBe(calmar);
    const omega = new OmegaRatioRTIndicator(20);
    expect(omega.withThreshold(0.001)).toBe(omega);
    const sharpe = new SharpeRatioRTIndicator(20);
    expect(sharpe.withRiskFreeRate(0.0002).withAnnualizationFactor(2)).toBe(sharpe);
    const sortino = new SortinoRatioRTIndicator(20);
    expect(sortino.withMAR(0.001).withAnnualizationFactor(2)).toBe(sortino);
    const ewma = new EwmaVolatilityRTIndicator();
    expect(ewma.withAnnualizationFactor(2)).toBe(ewma);
    const realized = new RealizedVolatilityRTIndicator(20);
    expect(realized.withAnnualizationFactor(2)).toBe(realized);
  });
});

describe("reset()", () => {
  const prices = reference.inputs.price.slice(0, 120);
  const others = reference.inputs.price.slice(300, 420);

  it.each([
    ["Calmar", () => new CalmarRatioRTIndicator(20)],
    ["MaxDrawdown", () => new MaxDrawdownRTIndicator()],
    ["Omega", () => new OmegaRatioRTIndicator(20)],
    ["Sharpe", () => new SharpeRatioRTIndicator(20)],
    ["Sortino", () => new SortinoRatioRTIndicator(20)],
    ["Tail", () => new TailRatioRTIndicator(20)],
    ["Ulcer", () => new UlcerIndexRTIndicator(20)],
    ["Ewma", () => new EwmaVolatilityRTIndicator()],
    ["Realized", () => new RealizedVolatilityRTIndicator(20)],
    ["ALMA", () => new AlmaRTIndicator(20)],
    ["DEMA", () => new DemaRTIndicator(20)],
    ["Envelopes", () => new EnvelopesRTIndicator()],
    ["FRAMA", () => new FramaRTIndicator()],
    ["LSMA", () => new LeastSquaresMovingAverageRTIndicator()],
    ["McGinley Dynamic", () => new McGinleyDynamicRTIndicator()],
    ["Momentum", () => new MomentumRTIndicator()],
    ["ROC", () => new RocRTIndicator()],
    ["CMO", () => new CmoRTIndicator()],
    ["DPO", () => new DetrendedPriceOscillatorRTIndicator()],
    ["Chande forecast oscillator", () => new ChandeForecastOscillatorRTIndicator()],
    ["Connors RSI", () => new ConnorsRsiRTIndicator()],
    ["Coppock", () => new CoppockCurveRTIndicator()],
    ["Fisher", () => new FisherTransformRTIndicator()],
    ["adaptive Fisher", () => new AdaptiveFisherTransformRTIndicator()],
    ["KST", () => new KnowSureThingRTIndicator()],
    ["TRIX", () => new TrixRTIndicator()],
    ["TSI", () => new TrueStrengthIndexRTIndicator()],
  ] as const)("%s starts again as a new one after it", (_, make) => {
    const used = make();
    for (const price of prices) used.update(price);
    used.reset();
    expect(used.getValue()).toBe(0);
    expect(used.isReady()).toBe(false);
    const fresh = make();
    for (const price of others) {
      expect(used.update(price)).toBe(fresh.update(price));
      expect(used.isReady()).toBe(fresh.isReady());
    }
  });
});

describe("reset() of the indicators with more than one output", () => {
  const prices = reference.inputs.price.slice(0, 120);

  it("Envelopes clears its bands", () => {
    const envelopes = new EnvelopesRTIndicator();
    for (const price of prices) envelopes.update(price);
    expect(envelopes.getUpper()).not.toBe(0);
    envelopes.reset();
    expect(envelopes.getUpper()).toBe(0);
    expect(envelopes.getLower()).toBe(0);
  });

  it("FRAMA clears its fractal dimension and its alpha", () => {
    const frama = new FramaRTIndicator();
    for (const price of prices) frama.update(price);
    expect(frama.getAlpha()).not.toBe(0);
    expect(frama.getFractalDimension()).not.toBe(0);
    frama.reset();
    expect(frama.getAlpha()).toBe(0);
    expect(frama.getFractalDimension()).toBe(0);
  });

  it("the Chande forecast oscillator clears the average it reads", () => {
    const chande = new ChandeForecastOscillatorRTIndicator();
    for (const price of prices) chande.update(price);
    expect(chande.getLsmaValue()).not.toBe(0);
    chande.reset();
    expect(chande.getLsmaValue()).toBe(0);
  });

  it("KST clears its signal", () => {
    const kst = new KnowSureThingRTIndicator();
    for (const price of reference.inputs.price) kst.update(price);
    expect(kst.getSignal()).not.toBe(0);
    kst.reset();
    expect(kst.getSignal()).toBe(0);
  });

  it("the adaptive Fisher clears its ratio and goes back to its longest window", () => {
    const adaptive = new AdaptiveFisherTransformRTIndicator();
    for (const price of prices) adaptive.update(price);
    expect(adaptive.getEfficiencyRatio()).not.toBe(0);
    expect(adaptive.getAdaptivePeriod()).not.toBe(20);
    adaptive.reset();
    expect(adaptive.getEfficiencyRatio()).toBe(0);
    expect(adaptive.getAdaptivePeriod()).toBe(20);
  });
});
