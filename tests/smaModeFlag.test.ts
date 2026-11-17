import { describe, it, expect } from "vitest";
import { AwesomeOscillatorRTIndicator } from "$momentum/AwesomeOscillatorRTIndicator";
import { AcceleratorOscillatorRTIndicator } from "$momentum/AcceleratorOscillatorRTIndicator";
import { StochasticOscillatorRTIndicator } from "$momentum/StochasticOscillatorRTIndicator";
import { RelativeVigorIndexRTIndicator } from "$momentum/RelativeVigorIndexRTIndicator";
import { KnowSureThingRTIndicator } from "$momentum/KnowSureThingRTIndicator";

/** The oscillators whose averages are moving by default; the flag `true` keeps the discrete averages. */
describe("the averages of the oscillators: moving by default, discrete with the flag", () => {
  it("the Awesome Oscillator default is the moving average of Williams", () => {
    const ao = new AwesomeOscillatorRTIndicator(2, 3);
    let last = NaN;
    for (let i = 1; i <= 10; i++) last = ao.update(i);
    // SMA2 - SMA3 at t = 10: (t - 0.5) - (t - 1) = 0.5
    expect(last).toBeCloseTo(0.5, 12);
  });

  it("the Awesome Oscillator flag false is the default", () => {
    const defaults = new AwesomeOscillatorRTIndicator(3, 8);
    const explicit = new AwesomeOscillatorRTIndicator(3, 8, false);
    let close = 100;
    let seed = 7;
    for (let i = 0; i < 200; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      close += seed / 2147483648 - 0.5;
      expect(explicit.update(close)).toBe(defaults.update(close));
    }
  });

  it("the Awesome Oscillator flag true keeps the discrete averages", () => {
    const moving = new AwesomeOscillatorRTIndicator(3, 8, false);
    const discrete = new AwesomeOscillatorRTIndicator(3, 8, true);
    let close = 100;
    let seed = 7;
    let differs = false;
    for (let i = 0; i < 200; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      close += seed / 2147483648 - 0.5;
      if (moving.update(close) !== discrete.update(close)) differs = true;
    }
    expect(differs).toBe(true);
  });

  it("the other four take the flag, and the flag changes their values", () => {
    const ac = [new AcceleratorOscillatorRTIndicator(), new AcceleratorOscillatorRTIndicator(true)];
    const stoch = [new StochasticOscillatorRTIndicator(), new StochasticOscillatorRTIndicator(14, 3, 3, true)];
    const rvgi = [new RelativeVigorIndexRTIndicator(), new RelativeVigorIndexRTIndicator(10, true)];
    const kst = [
      new KnowSureThingRTIndicator(),
      new KnowSureThingRTIndicator([10, 15, 20, 30], [10, 10, 10, 15], [1, 2, 3, 4], 9, true),
    ];
    for (let i = 0; i < 80; i++) {
      const close = 100 + Math.sin(i / 3) * 5 + i * 0.05;
      ac.forEach((x) => x.updateHL(close + 1, close - 1));
      stoch.forEach((x) => x.updateOhlc(close + 1, close - 1, close));
      rvgi.forEach((x) => x.updateOhlc(close - 0.5 + Math.cos(i), close + 1 + Math.sin(i), close - 1 - Math.cos(i / 2), close));
      kst.forEach((x) => x.update(close));
    }
    expect(ac[0].getValue()).not.toBe(ac[1].getValue());
    expect(stoch[0].getValue()).not.toBe(stoch[1].getValue());
    expect(rvgi[0].getValue()).not.toBe(rvgi[1].getValue());
    expect(kst[0].getValue()).not.toBe(kst[1].getValue());
  });
});
