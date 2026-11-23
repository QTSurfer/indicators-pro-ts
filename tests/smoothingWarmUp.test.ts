import { describe, expect, it } from "vitest";
import { AcceleratorOscillatorRTIndicator } from "../src/momentum/AcceleratorOscillatorRTIndicator";
import { KnowSureThingRTIndicator } from "../src/momentum/KnowSureThingRTIndicator";
import { StochasticOscillatorRTIndicator } from "../src/momentum/StochasticOscillatorRTIndicator";

// An indicator that smooths a line it computes from other averages must feed the smoothing only with
// values that are valid: the Accelerator Oscillator, the Know Sure Thing and the stochastic used to
// feed their averages from the first update, so for the first updates the line carried the warm-up of
// the averages behind it, and they said they were ready long before it was gone.
//
// Each test computes the textbook value on its own, from plain arrays, and checks that the indicator
// is ready exactly from the update where that value starts to be valid.

const BARS = 120;

const mid = Array.from({ length: BARS }, (_, i) => 100 + 12 * Math.sin(i / 5) + 3 * Math.cos(i / 1.7) + i * 0.3);

/** The mean of `values[to - length + 1 .. to]`. */
function mean(values: number[], to: number, length: number): number {
  let sum = 0;
  for (let i = to - length + 1; i <= to; i++) {
    sum += values[i]!;
  }
  return sum / length;
}

describe("the smoothing of a line that is computed from averages", () => {
  it("the accelerator oscillator is ready and exact from the thirty-eighth update", () => {
    const ao = new Array<number>(BARS).fill(0);
    const ac = new AcceleratorOscillatorRTIndicator();

    for (let i = 0; i < BARS; i++) {
      ac.updateHL(mid[i]! + 1.5, mid[i]! - 1.5);
      if (i >= 33) {
        ao[i] = mean(mid, i, 5) - mean(mid, i, 34);
      }
      const valid = i >= 37; // 34 for the slow average, then 5 values of an AO that is valid
      expect(ac.isReady(), `ready at update ${i + 1}`).toBe(valid);
      if (valid) {
        expect(ac.getValue(), `AC at update ${i + 1}`).toBeCloseTo(ao[i]! - mean(ao, i, 5), 9);
      }
    }
  });

  it("the know sure thing and its signal are ready and exact from the fifty-third update", () => {
    const roc = [10, 15, 20, 30];
    const smoothing = [10, 10, 10, 15];
    const weight = [1, 2, 3, 4];
    const kst = new Array<number>(BARS).fill(0);
    const indicator = new KnowSureThingRTIndicator();

    for (let i = 0; i < BARS; i++) {
      indicator.update(mid[i]!);
      const kstValid = i >= 44; // the slowest average, 15 values of a rate that starts at 31
      const ready = i >= 52; // and then the 9 values the signal averages
      if (kstValid) {
        let sum = 0;
        for (let k = 0; k < roc.length; k++) {
          const rates = new Array<number>(BARS).fill(0);
          for (let j = roc[k]!; j <= i; j++) {
            rates[j] = ((mid[j]! - mid[j - roc[k]!]!) / mid[j - roc[k]!]!) * 100;
          }
          sum += weight[k]! * mean(rates, i, smoothing[k]!);
        }
        kst[i] = sum;
        expect(indicator.getValue(), `KST at update ${i + 1}`).toBeCloseTo(kst[i]!, 9);
      }
      expect(indicator.isReady(), `ready at update ${i + 1}`).toBe(ready);
      if (ready) {
        expect(indicator.getSignal(), `signal at update ${i + 1}`).toBeCloseTo(mean(kst, i, 9), 9);
      }
    }
  });

  it("the stochastic is ready when both lines are, and each is exact from its own update", () => {
    const raw = new Array<number>(BARS).fill(0);
    const k = new Array<number>(BARS).fill(0);
    const high = new Array<number>(BARS).fill(0);
    const low = new Array<number>(BARS).fill(0);
    const close = new Array<number>(BARS).fill(0);
    const stochastic = new StochasticOscillatorRTIndicator();

    for (let i = 0; i < BARS; i++) {
      high[i] = mid[i]! + 1.5 + Math.abs(Math.sin(i));
      low[i] = mid[i]! - 1.5;
      close[i] = mid[i]! + 0.5 * Math.cos(i);
      stochastic.updateOhlc(high[i]!, low[i]!, close[i]!);
      if (i >= 13) {
        const highest = Math.max(...high.slice(i - 13, i + 1));
        const lowest = Math.min(...low.slice(i - 13, i + 1));
        raw[i] = ((close[i]! - lowest) / (highest - lowest)) * 100;
      }
      if (i >= 15) {
        k[i] = mean(raw, i, 3);
        expect(stochastic.getPercentK(), `%K at update ${i + 1}`).toBeCloseTo(k[i]!, 9);
      }
      if (i >= 17) {
        expect(stochastic.getPercentD(), `%D at update ${i + 1}`).toBeCloseTo(mean(k, i, 3), 9);
      }
      expect(stochastic.isReady(), `ready at update ${i + 1}`).toBe(i >= 17);
    }
  });

  it("the stochastic reads the raw %K before its first full window", () => {
    const stochastic = new StochasticOscillatorRTIndicator();

    stochastic.updateOhlc(12, 8, 11);
    expect(stochastic.getPercentK()).toBeCloseTo(75, 9);
    expect(stochastic.getPercentD()).toBe(0);
  });

  it("resetting them starts the warm-up again", () => {
    const ac = new AcceleratorOscillatorRTIndicator();
    for (let i = 0; i < BARS; i++) {
      ac.updateHL(mid[i]! + 1, mid[i]! - 1);
    }
    expect(ac.isReady()).toBe(true);

    ac.reset();
    for (let i = 0; i < 37; i++) {
      ac.updateHL(mid[i]! + 1, mid[i]! - 1);
    }
    expect(ac.isReady()).toBe(false);
    ac.updateHL(mid[37]! + 1, mid[37]! - 1);
    expect(ac.isReady()).toBe(true);
  });
});
