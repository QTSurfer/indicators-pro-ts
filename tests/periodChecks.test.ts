import { describe, expect, it } from "vitest";
import { EwmaVolatilityRTIndicator } from "$statistics/volatility/EwmaVolatilityRTIndicator";
import { RollingPercentileRTIndicator } from "$statistics/RollingPercentileRTIndicator";
import { GarmanKlassVolatilityRTIndicator } from "$statistics/volatility/GarmanKlassVolatilityRTIndicator";
import { HurstExponentRTIndicator } from "$statistics/HurstExponentRTIndicator";
import { IchimokuRTIndicator } from "$trend/IchimokuRTIndicator";
import { KurtosisRTIndicator } from "$statistics/KurtosisRTIndicator";
import { LinearRegressionSlopeRTIndicator } from "$statistics/LinearRegressionSlopeRTIndicator";
import { CmfRTIndicator } from "$volume/CmfRTIndicator";
import { MfiRTIndicator } from "$volume/MfiRTIndicator";
import { ParkinsonVolatilityRTIndicator } from "$statistics/volatility/ParkinsonVolatilityRTIndicator";
import { RealizedVolatilityRTIndicator } from "$statistics/volatility/RealizedVolatilityRTIndicator";
import { RogersSatchellVolatilityRTIndicator } from "$statistics/volatility/RogersSatchellVolatilityRTIndicator";
import { SharpeRatioRTIndicator } from "$statistics/ratios/SharpeRatioRTIndicator";
import { SimpleLinearRegressionRTIndicator } from "$statistics/SimpleLinearRegressionRTIndicator";
import { SkewnessRTIndicator } from "$statistics/SkewnessRTIndicator";
import { ValueAtRiskRTIndicator } from "$statistics/ValueAtRiskRTIndicator";

// The period checks of the classes that did not have a clear one: they run first, before the window or a buffer is
// built, so neither the window's text nor a typed array's shows. The texts are the Java engine's; a period of the
// size of Java's smallest int is written as Java writes it.

const MIN_INT = -2147483648;
const BAD = [0, -1, MIN_INT];

describe("a period below the minimum is rejected before anything is built, with the Java text", () => {
  it.each([
    ["Skewness", (p: number) => new SkewnessRTIndicator(p), 3],
    ["Kurtosis", (p: number) => new KurtosisRTIndicator(p), 4],
    ["Hurst exponent", (p: number) => new HurstExponentRTIndicator(p), 4],
    ["Value at Risk", (p: number) => new ValueAtRiskRTIndicator(p), 2],
    ["Sharpe ratio", (p: number) => new SharpeRatioRTIndicator(p), 2],
    ["Realized volatility", (p: number) => new RealizedVolatilityRTIndicator(p), 1],
    ["Parkinson volatility", (p: number) => new ParkinsonVolatilityRTIndicator(p), 1],
    ["Garman-Klass volatility", (p: number) => new GarmanKlassVolatilityRTIndicator(p), 1],
    ["Rogers-Satchell volatility", (p: number) => new RogersSatchellVolatilityRTIndicator(p), 1],
  ] as const)("%s needs at least %d periods", (_, make, minimum) => {
    for (const periods of [...BAD, minimum - 1]) {
      expect(() => make(periods), String(periods)).toThrow(new RangeError(`Periods must be >= ${minimum}, got: ${periods}`));
    }
    expect(() => make(minimum)).not.toThrow();
  });

  it.each([
    ["linear regression slope", (p: number) => new LinearRegressionSlopeRTIndicator(p)],
    ["simple linear regression", (p: number) => new SimpleLinearRegressionRTIndicator(p)],
  ] as const)("the %s keeps its old text: lower case, no colon", (_, make) => {
    for (const periods of [...BAD, 1]) {
      expect(() => make(periods), String(periods)).toThrow(new RangeError(`periods must be >= 2, got ${periods}`));
    }
    expect(() => make(2)).not.toThrow();
  });

  it("the Value at Risk checks the period before the confidence", () => {
    expect(() => new ValueAtRiskRTIndicator(1)).toThrow(new RangeError("Periods must be >= 2, got: 1"));
    expect(() => new ValueAtRiskRTIndicator(20).withConfidenceLevel(1)).toThrow(
      new RangeError("Confidence must be in (0, 1), got: 1.0"),
    );
  });

  it("the CMF and the MFI reject only a negative period, and accept 0", () => {
    for (const periods of [-1, MIN_INT]) {
      expect(() => new CmfRTIndicator(periods), String(periods)).toThrow(new RangeError(`Periods must be >= 0, got: ${periods}`));
      expect(() => new MfiRTIndicator(periods), String(periods)).toThrow(new RangeError(`Periods must be >= 0, got: ${periods}`));
    }
    expect(() => new CmfRTIndicator(0)).not.toThrow();
    expect(() => new MfiRTIndicator(0)).not.toThrow();
  });

  it("the Ichimoku rejects only a negative senkou period, and checks neither the tenkan nor the kijun", () => {
    for (const periods of [-1, MIN_INT]) {
      expect(() => new IchimokuRTIndicator(9, 26, periods), String(periods)).toThrow(
        new RangeError(`SenkouPeriod must be >= 0, got: ${periods}`),
      );
    }
    expect(() => new IchimokuRTIndicator(9, 26, 0)).not.toThrow();
    expect(() => new IchimokuRTIndicator(-1, -1, 52)).not.toThrow();
  });
});

describe("the doubles of the messages are written as Java writes them", () => {
  it("a whole confidence, lambda or percentile keeps its .0, and a large one its exponent", () => {
    expect(() => new ValueAtRiskRTIndicator(20).withConfidenceLevel(1)).toThrow(new RangeError("Confidence must be in (0, 1), got: 1.0"));
    expect(() => new ValueAtRiskRTIndicator(20).withConfidenceLevel(-2)).toThrow(new RangeError("Confidence must be in (0, 1), got: -2.0"));
    expect(() => new EwmaVolatilityRTIndicator(1)).toThrow(new RangeError("Lambda must be in (0, 1), got: 1.0"));
    expect(() => new EwmaVolatilityRTIndicator(0)).toThrow(new RangeError("Lambda must be in (0, 1), got: 0.0"));
    expect(() => new EwmaVolatilityRTIndicator(1e200)).toThrow(new RangeError("Lambda must be in (0, 1), got: 1.0E200"));
    expect(() => new RollingPercentileRTIndicator(20, 2)).toThrow(new RangeError("Percentile must be in [0, 1], got: 2.0"));
    expect(() => new RollingPercentileRTIndicator(20, -0.5)).toThrow(new RangeError("Percentile must be in [0, 1], got: -0.5"));
  });
});
