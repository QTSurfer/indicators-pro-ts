import { describe, expect, it } from "vitest";
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
