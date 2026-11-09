import { WindowSeriesStore } from "@qtsurfer/core";

/** Small helpers over the values of a window, oldest first; not part of the public surface. */

/** A window that hands each value it evicts to a callback: one class for every instance. */
export class EvictingWindow extends WindowSeriesStore {
  constructor(
    size: number,
    private readonly evicted: (value: number) => void,
  ) {
    super(size);
  }

  protected override onRollingWindow(firstValue: number): void {
    this.evicted(firstValue);
  }
}

/**
 * Copies the values of a window, oldest first, into the first slots of `dest`, and returns how many.
 * As the Java engine's `WindowSeriesStore.copyTo`.
 */
export function copyWindow(window: WindowSeriesStore, dest: Float64Array): number {
  const n = window.size;
  if (dest.length < n) {
    throw new RangeError(`dest holds ${dest.length} values, the window has ${n}`);
  }
  for (let i = 0; i < n; i++) {
    dest[i] = window.getValue(i);
  }
  return n;
}

export function isFlat(values: ArrayLike<number>, n: number): boolean {
  for (let i = 1; i < n; i++) {
    if (values[i] !== values[0]) {
      return false;
    }
  }
  return true;
}

export function mean(values: ArrayLike<number>, n: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += values[i];
  }
  return sum / n;
}

/** `Σ(x - mean)²`. */
export function sumSquaredDeviations(values: ArrayLike<number>, n: number, mean: number): number {
  let squares = 0;
  for (let i = 0; i < n; i++) {
    const deviation = values[i] - mean;
    squares += deviation * deviation;
  }
  return squares;
}
