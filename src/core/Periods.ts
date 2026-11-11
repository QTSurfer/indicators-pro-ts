/**
 * The check of a period that the Java engine's pro indicators run FIRST, before they create their window or their
 * buffers (the window store would fail with its own text): a period below `minimum` throws a `RangeError` with the
 * Java message. It returns the period, so it can be written as `super(minimumPeriods(periods, 3))`.
 */
export function minimumPeriods(periods: number, minimum: number): number {
  if (periods < minimum) {
    throw new RangeError(`Periods must be >= ${minimum}, got: ${periods}`);
  }
  return periods;
}
