import { describe, expect, it } from "vitest";
import { javaDouble } from "$core/JavaNumber";

// Each expected string was written by the JVM (`Double.toString`, JDK 25) for the same double. The helper only has to
// agree with it for the messages of the constructors, but it agrees on every value of a much larger sample (random bit
// patterns, every power of two, a significand of one or two digits at every exponent, the multiples of the smallest
// double) that was checked against the JVM when it was written.

const SMALLEST = Number.MIN_VALUE; // 4.9E-324 in Java

describe("javaDouble", () => {
  it.each([
    // plain decimal form from 10^-3 up to 10^7, with at least one digit after the point
    [1, "1.0"],
    [0.5, "0.5"],
    [0.001, "0.001"],
    [0.00123, "0.00123"],
    [0.002, "0.002"],
    [0.01, "0.01"],
    [0.1, "0.1"],
    [0.3, "0.3"],
    [0.1 + 0.2, "0.30000000000000004"],
    [1 / 3, "0.3333333333333333"],
    [2 / 3, "0.6666666666666666"],
    [0.85, "0.85"],
    [2.5, "2.5"],
    [4.35, "4.35"],
    [10, "10.0"],
    [100, "100.0"],
    [99.99, "99.99"],
    [100 / 3, "33.333333333333336"],
    [123456.789, "123456.789"],
    [1000000, "1000000.0"],
    [1234567, "1234567.0"],
    [9999999, "9999999.0"],
    [9999999.999999998, "9999999.999999998"],
    [0.9999999999999999, "0.9999999999999999"],
    [1.0000000000000002, "1.0000000000000002"],
    [-6, "-6.0"],
    [-0.5, "-0.5"],
    // scientific form below 10^-3 and from 10^7
    [9.999999999999998e-4, "9.999999999999998E-4"],
    [9.999e-4, "9.999E-4"],
    [0.000999, "9.99E-4"],
    [5e-4, "5.0E-4"],
    [1e-4, "1.0E-4"],
    [9.5e-5, "9.5E-5"],
    [6e-5, "6.0E-5"],
    [2.5e-5, "2.5E-5"],
    [1e-7, "1.0E-7"],
    [3e-10, "3.0E-10"],
    [1e-300, "1.0E-300"],
    [-1e-200, "-1.0E-200"],
    [1e7, "1.0E7"],
    [1.0000000000000002e7, "1.0000000000000002E7"],
    [1e7 + 0.5, "1.00000005E7"],
    [12345678.9, "1.23456789E7"],
    [123456789, "1.23456789E8"],
    [1e9, "1.0E9"],
    [1e15, "1.0E15"],
    [1e16, "1.0E16"],
    [1234567890123456800, "1.2345678901234568E18"],
    [9007199254740993, "9.007199254740992E15"],
    [1e21, "1.0E21"],
    [1e22, "1.0E22"],
    [8.41e21, "8.41E21"],
    [1e23, "1.0E23"],
    [2e23, "2.0E23"],
    [7e22, "7.0E22"],
    [1e200, "1.0E200"],
    [-1e200, "-1.0E200"],
    [1e300, "1.0E300"],
    [Number.MAX_VALUE, "1.7976931348623157E308"],
    [-Number.MAX_VALUE, "-1.7976931348623157E308"],
    [2.2250738585072014e-308, "2.2250738585072014E-308"],
  ])("writes %s as %s", (value, expected) => {
    expect(javaDouble(value)).toBe(expected);
  });

  it("writes NaN, the infinities and the two zeros", () => {
    expect(javaDouble(NaN)).toBe("NaN");
    expect(javaDouble(Infinity)).toBe("Infinity");
    expect(javaDouble(-Infinity)).toBe("-Infinity");
    expect(javaDouble(0)).toBe("0.0");
    expect(javaDouble(-0)).toBe("-0.0");
  });

  it("writes two digits where the shortest decimal has one and the smallest doubles are not exact: Java is not JavaScript here", () => {
    // JavaScript writes 5e-324, 1e-323, 2e-323, 4e-323 and 1.5e-323; Java writes the closest decimal of two digits that
    // gives the double back
    expect(javaDouble(SMALLEST)).toBe("4.9E-324");
    expect(javaDouble(2 * SMALLEST)).toBe("9.9E-324");
    expect(javaDouble(3 * SMALLEST)).toBe("1.5E-323");
    expect(javaDouble(4 * SMALLEST)).toBe("2.0E-323");
    expect(javaDouble(8 * SMALLEST)).toBe("4.0E-323");
    expect(javaDouble(-SMALLEST)).toBe("-4.9E-324");
  });
});
