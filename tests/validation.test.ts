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

describe("the guards of the averages and the momentum indicators", () => {
  it.each([
    ["ALMA", (periods: number) => new AlmaRTIndicator(periods), 0],
    ["DPO", (periods: number) => new DetrendedPriceOscillatorRTIndicator(periods), 0],
    ["Momentum", (periods: number) => new MomentumRTIndicator(periods), 1],
    ["ROC", (periods: number) => new RocRTIndicator(periods), 1],
  ] as const)("%s builds a window of its periods, and the window refuses fewer than one value", (_, make, extra) => {
    for (const periods of [-extra, -extra - 3]) {
      expect(() => make(periods), `${periods}`).toThrow(new RangeError(`Invalid ${periods + extra} windowSize`));
    }
    expect(() => make(1 - extra)).not.toThrow();
  });

  it("FRAMA adds one to an odd number of periods, as Java does, and to a negative one too", () => {
    expect(new FramaRTIndicator().periods).toBe(20);
    expect(new FramaRTIndicator(7).periods).toBe(8);
    expect(new FramaRTIndicator(8).periods).toBe(8);
    expect(new FramaRTIndicator(1).periods).toBe(2);
    expect(() => new FramaRTIndicator(-1)).toThrow(new RangeError("Invalid 0 windowSize"));
    expect(() => new FramaRTIndicator(-3)).toThrow(new RangeError("Invalid -2 windowSize"));
    expect(() => new FramaRTIndicator(-4)).toThrow(new RangeError("Invalid -4 windowSize"));
  });

  it("LSMA takes the guards of the regression it wraps", () => {
    expect(() => new LeastSquaresMovingAverageRTIndicator(1)).toThrow(new RangeError("periods must be >= 2, got 1"));
    expect(() => new LeastSquaresMovingAverageRTIndicator(0)).toThrow(new RangeError("Invalid 0 windowSize"));
    expect(() => new LeastSquaresMovingAverageRTIndicator(2)).not.toThrow();
  });

  it("CMO refuses a negative number of periods", () => {
    expect(() => new CmoRTIndicator(-1)).toThrow(RangeError);
    expect(() => new CmoRTIndicator(1)).not.toThrow();
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
});

describe("the guards of the momentum oscillators", () => {
  const prices = reference.inputs.price.slice(0, 90);

  it("the Chande forecast oscillator takes the guards of the regression it wraps", () => {
    expect(() => new ChandeForecastOscillatorRTIndicator(1)).toThrow(new RangeError("periods must be >= 2, got 1"));
    expect(() => new ChandeForecastOscillatorRTIndicator(0)).toThrow(new RangeError("Invalid 0 windowSize"));
    expect(() => new ChandeForecastOscillatorRTIndicator(2)).not.toThrow();
  });

  it("Connors RSI builds its RSIs first, which take any period: only a rank window of no periods fails", () => {
    expect(() => new ConnorsRsiRTIndicator(0, 0, 5)).not.toThrow();
    expect(() => new ConnorsRsiRTIndicator(-1, -1, 5)).not.toThrow();
    expect(() => new ConnorsRsiRTIndicator(3, 2, 0)).toThrow(new RangeError("Invalid 0 windowSize"));
    expect(() => new ConnorsRsiRTIndicator(3, 2, -4)).toThrow(new RangeError("Invalid -4 windowSize"));
    expect(() => new ConnorsRsiRTIndicator(3, 2, 1)).not.toThrow();
  });

  it("Coppock builds the long rate of change, then the short one, then the average: the first that fails speaks", () => {
    // a rate of change keeps a window of its periods + 1 prices
    expect(() => new CoppockCurveRTIndicator(-3, -2, 0)).toThrow(new RangeError("Invalid -2 windowSize"));
    expect(() => new CoppockCurveRTIndicator(5, -2, 0)).toThrow(new RangeError("Invalid -1 windowSize"));
    expect(() => new CoppockCurveRTIndicator(5, 5, 0)).toThrow(new RangeError("Invalid 0 windowSize"));
    expect(() => new CoppockCurveRTIndicator(0, 0, 1)).not.toThrow();
  });

  it("Fisher and the adaptive Fisher keep a window, and the window refuses fewer than one value", () => {
    expect(() => new FisherTransformRTIndicator(0)).toThrow(new RangeError("Invalid 0 windowSize"));
    expect(() => new FisherTransformRTIndicator(-3)).toThrow(new RangeError("Invalid -3 windowSize"));
    expect(() => new FisherTransformRTIndicator(1)).not.toThrow();
    expect(() => new AdaptiveFisherTransformRTIndicator(10, 5, 0)).toThrow(new RangeError("Invalid 0 windowSize"));
    expect(() => new AdaptiveFisherTransformRTIndicator(10, 5, -2)).toThrow(new RangeError("Invalid -2 windowSize"));
  });

  it("the adaptive Fisher checks neither the order of its periods nor a negative efficiency period", () => {
    expect(() => new AdaptiveFisherTransformRTIndicator(10, 8, 4)).not.toThrow();
    const negative = new AdaptiveFisherTransformRTIndicator(-1, 5, 20);
    // the window is asked for the price 1 + 1 ticks back, which it does not have
    expect(() => negative.update(100)).toThrow(RangeError);
  });

  it("KST reads as many average periods as it has rates of change, and fails like Java when it has fewer", () => {
    expect(() => new KnowSureThingRTIndicator([3, 5, 7], [2, 3], [1, 2, 3], 4)).toThrow(new RangeError("Index 2 out of bounds for length 2"));
    expect(() => new KnowSureThingRTIndicator([3, 5, 7], [], [1, 2, 3], 4)).toThrow(new RangeError("Index 0 out of bounds for length 0"));
    // the rate of change that Java builds first is the one that fails when its period is not valid
    expect(() => new KnowSureThingRTIndicator([3, -1, 5], [2], [1, 2], 4)).toThrow(new RangeError("Invalid 0 windowSize"));
    // more average periods than rates of change are not read
    expect(() => new KnowSureThingRTIndicator([3, 5], [2, 3, 4], [1, 2], 4)).not.toThrow();
  });

  it("KST fails at the first tick, like Java, when it has fewer weights than rates of change", () => {
    const kst = new KnowSureThingRTIndicator([3, 5, 7], [2, 3, 4], [1, 2], 4);
    expect(() => kst.update(100)).toThrow(new RangeError("Index 2 out of bounds for length 2"));
    // more weights than rates of change are not read
    const longer = new KnowSureThingRTIndicator([2], [2], [1, 2, 3], 2);
    expect(() => prices.slice(0, 10).forEach((p) => longer.update(p))).not.toThrow();
  });

  it("KST keeps the array of weights it was given, as Java does, and with no rate of change it is 0", () => {
    const weights = [1];
    const kept = new KnowSureThingRTIndicator([2], [2], weights, 2);
    weights[0] = 3;
    const threeFromTheStart = new KnowSureThingRTIndicator([2], [2], [3], 2);
    for (const price of prices) expect(kept.update(price)).toBe(threeFromTheStart.update(price));
    const empty = new KnowSureThingRTIndicator([], [], [], 4);
    expect(empty.update(100)).toBe(0);
    expect(empty.isReady()).toBe(false);
  });

  it("TRIX and TSI take any number of periods, as Java does", () => {
    for (const periods of [0, -1, 1]) {
      expect(() => new TrixRTIndicator(periods), `${periods}`).not.toThrow();
      expect(() => new TrueStrengthIndexRTIndicator(periods, periods), `${periods}`).not.toThrow();
    }
  });

  it("the periods are what the constructor was given, and the default of each class is Java's", () => {
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

describe("what the momentum oscillators do with a value that is not finite", () => {
  const before = reference.inputs.price.slice(0, 60);
  const after = reference.inputs.price.slice(60, 160);

  it.each([
    ["KST", () => new KnowSureThingRTIndicator()],
    ["TRIX", () => new TrixRTIndicator()],
    ["TSI", () => new TrueStrengthIndexRTIndicator()],
    ["Connors RSI", () => new ConnorsRsiRTIndicator()],
  ] as const)("%s stays finite on a NaN and on an infinite price", (_, make) => {
    const indicator = make();
    for (const price of [...before, NaN, ...after.slice(0, 20), Infinity, ...after.slice(20)]) {
      expect(Number.isFinite(indicator.update(price))).toBe(true);
    }
  });

  it("the Chande forecast oscillator is NaN on that tick only, because the average it wraps leaves the value out", () => {
    const chande = new ChandeForecastOscillatorRTIndicator();
    for (const price of before) chande.update(price);
    expect(chande.update(NaN)).toBeNaN();
    expect(Number.isFinite(chande.getLsmaValue())).toBe(true);
    expect(Number.isFinite(chande.update(after[0]))).toBe(true);
  });

  it.each([
    ["Coppock", () => new CoppockCurveRTIndicator()],
    ["Fisher", () => new FisherTransformRTIndicator()],
    ["adaptive Fisher", () => new AdaptiveFisherTransformRTIndicator()],
  ] as const)("%s is NaN from a NaN price on, until reset", (_, make) => {
    const indicator = make();
    for (const price of before) indicator.update(price);
    expect(indicator.update(NaN)).toBeNaN();
    for (const price of after) expect(indicator.update(price)).toBeNaN();
    indicator.reset();
    const fresh = make();
    for (const price of after) expect(indicator.update(price)).toBe(fresh.update(price));
  });

  it("the adaptive Fisher gives a NaN efficiency ratio the period 0, which is raised to the minimum, as Java's int does", () => {
    const adaptive = new AdaptiveFisherTransformRTIndicator();
    for (const price of before) adaptive.update(price);
    adaptive.update(NaN);
    expect(adaptive.getEfficiencyRatio()).toBeNaN();
    expect(adaptive.getAdaptivePeriod()).toBe(5);
    // the ratio looks back 10 ticks: it is NaN until the NaN has left that span, and the value stays NaN
    for (const price of after.slice(0, 9)) {
      adaptive.update(price);
      expect(adaptive.getEfficiencyRatio()).toBeNaN();
      expect(adaptive.getAdaptivePeriod()).toBe(5);
    }
    adaptive.update(after[9]);
    adaptive.update(after[10]);
    expect(Number.isFinite(adaptive.getEfficiencyRatio())).toBe(true);
    expect(adaptive.getValue()).toBeNaN();
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
