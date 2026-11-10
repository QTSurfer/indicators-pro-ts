/**
 * A number as Java's `Double.toString` writes it, for the messages of the constructors: `1.0E200` and not `1e+200`,
 * `-6.0` and not `-6`, `NaN`, `Infinity`, `-Infinity`, `-0.0`.
 *
 * Java (from JDK 19) writes the shortest decimal that gives the double back, as JavaScript does, with one difference:
 * when that decimal has a single digit, it writes the closest decimal of two digits that gives the double back
 * (`4.9E-324` for the smallest double, where JavaScript writes `5e-324`). A value from 10^-3 up to 10^7 is written in
 * plain decimal form with at least one digit after the point; any other value is written as `d.dddE[-]n`, with at
 * least one digit after the point and no `+` on the exponent.
 */
export function javaDouble(value: number): string {
  if (Number.isNaN(value)) return "NaN";
  if (value === Number.POSITIVE_INFINITY) return "Infinity";
  if (value === Number.NEGATIVE_INFINITY) return "-Infinity";
  if (value === 0) return Object.is(value, -0) ? "-0.0" : "0.0";

  const sign = value < 0 ? "-" : "";
  const magnitude = Math.abs(value);
  let [digits, exponent] = decompose(magnitude.toExponential());
  if (digits.length === 1) {
    // The shortest decimal has one digit: Java takes the closest one of two digits that still gives the double back.
    const longer = magnitude.toExponential(1);
    if (Number(longer) === magnitude) [digits, exponent] = decompose(longer);
  }
  digits = digits.replace(/0+$/, "") || "0";

  if (magnitude >= 1e-3 && magnitude < 1e7) {
    if (exponent >= 0) {
      const whole = digits.length > exponent + 1 ? digits.slice(0, exponent + 1) : digits.padEnd(exponent + 1, "0");
      return `${sign}${whole}.${digits.slice(exponent + 1) || "0"}`;
    }
    return `${sign}0.${"0".repeat(-exponent - 1)}${digits}`;
  }
  return `${sign}${digits[0]}.${digits.slice(1) || "0"}E${exponent}`;
}

/** The digits and the decimal exponent of the first digit of what `toExponential` wrote: `1.23e+2` is `["123", 2]`. */
function decompose(exponential: string): [string, number] {
  const [mantissa, exponent] = exponential.split("e");
  return [mantissa.replace(".", ""), Number(exponent)];
}
