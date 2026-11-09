import { expect } from "vitest";
import type { Encoded } from "./fixtures";

/**
 * How a series is compared with Java's. The arithmetic of + - * / and sqrt is exact everywhere, so those
 * series are equal to the last bit (`Object.is`: even the sign of a zero). An indicator that takes
 * logarithms is held to a relative 1e-12: JavaScript engines do not all round a logarithm the way Java's does.
 */
export const LOG_TOLERANCE = 1e-12;

const NON_FINITE = { NaN, Infinity, "-Infinity": -Infinity } as const;

/** The number an oracle value stands for: null is NaN (the older series write no other kind). */
export function decode(value: Encoded): number {
  return value === null ? NaN : typeof value === "string" ? NON_FINITE[value] : value;
}

/** The relative difference of a value from Java's; 0 when they are the same, Infinity when they cannot be compared. */
export function relativeError(actual: number, want: number): number {
  if (Object.is(actual, want)) return 0;
  if (!Number.isFinite(actual) || !Number.isFinite(want) || want === 0) return Infinity;
  return Math.abs(actual - want) / Math.abs(want);
}

export function expectSeries(actual: readonly number[], expected: readonly Encoded[], label: string, tolerance = 0): void {
  expect(actual, `${label}: length`).toHaveLength(expected.length);
  for (let i = 0; i < expected.length; i++) {
    const want = decode(expected[i]);
    if (tolerance === 0 || !Number.isFinite(want) || want === 0) {
      expect(actual[i], `${label} at bar ${i}`).toBe(want);
    } else {
      const relative = relativeError(actual[i], want);
      expect(relative, `${label} at bar ${i}: ${actual[i]} against ${want}`).toBeLessThanOrEqual(tolerance);
    }
  }
}
