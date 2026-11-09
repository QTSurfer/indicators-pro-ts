import { describe, expect, it } from "vitest";
import { AlmaRTIndicator } from "$averages/AlmaRTIndicator";
import { DemaRTIndicator } from "$averages/DemaRTIndicator";
import { EnvelopesRTIndicator } from "$averages/EnvelopesRTIndicator";
import { FramaRTIndicator } from "$averages/FramaRTIndicator";
import { LeastSquaresMovingAverageRTIndicator } from "$averages/LeastSquaresMovingAverageRTIndicator";
import { McGinleyDynamicRTIndicator } from "$averages/McGinleyDynamicRTIndicator";
import { CmoRTIndicator } from "$momentum/CmoRTIndicator";
import { DetrendedPriceOscillatorRTIndicator } from "$momentum/DetrendedPriceOscillatorRTIndicator";
import { MomentumRTIndicator } from "$momentum/MomentumRTIndicator";
import { RocRTIndicator } from "$momentum/RocRTIndicator";
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
});
