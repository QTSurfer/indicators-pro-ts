import type { Kline } from "@qtsurfer/core";
import type { AbstractRTIndicator } from "@qtsurfer/indicators";
import { describe, expect, it } from "vitest";
import { AcceleratorOscillatorRTIndicator } from "$momentum/AcceleratorOscillatorRTIndicator";
import { AwesomeOscillatorRTIndicator } from "$momentum/AwesomeOscillatorRTIndicator";
import { BalanceOfPowerRTIndicator } from "$momentum/BalanceOfPowerRTIndicator";
import { BullBearPowerRTIndicator } from "$momentum/BullBearPowerRTIndicator";
import { RelativeVigorIndexRTIndicator } from "$momentum/RelativeVigorIndexRTIndicator";
import { StochasticOscillatorRTIndicator } from "$momentum/StochasticOscillatorRTIndicator";
import { UltimateOscillatorRTIndicator } from "$momentum/UltimateOscillatorRTIndicator";
import { WilliamsRRTIndicator } from "$momentum/WilliamsRRTIndicator";
import { AdlRTIndicator } from "$volume/AdlRTIndicator";
import { ChaikinOscillatorRTIndicator } from "$volume/ChaikinOscillatorRTIndicator";
import { EaseOfMovementRTIndicator } from "$volume/EaseOfMovementRTIndicator";
import { ElderForceIndexRTIndicator } from "$volume/ElderForceIndexRTIndicator";
import { KlingerOscillatorRTIndicator } from "$volume/KlingerOscillatorRTIndicator";
import { NegativeVolumeIndexRTIndicator } from "$volume/NegativeVolumeIndexRTIndicator";
import { PvtRTIndicator } from "$volume/PvtRTIndicator";
import { inputsOf, klines } from "./fixtures";

// The bar at which each momentum and volume bar reader becomes ready, counting the bars it takes (a bar that it leaves
// out is not counted). The bar-by-bar readiness is also compared with Java's in parity.test.ts and barEdges.test.ts;
// these are the numbers written down. Two rules are worth the pins: an indicator made of two averages is ready only when
// both are, and one that is ready after its first bar is ready after its first bar that is taken.

type BarIndicator = AbstractRTIndicator & { updateFrom(bar: Kline): void };

/** [label, make, the number of the bar (1 is the first) after which it is ready]. */
const cases: [string, () => BarIndicator, number][] = [
  ["Accelerator Oscillator", () => new AcceleratorOscillatorRTIndicator(), 34],
  ["Awesome Oscillator()", () => new AwesomeOscillatorRTIndicator(), 34],
  ["Awesome Oscillator(3, 8)", () => new AwesomeOscillatorRTIndicator(3, 8), 8],
  ["Awesome Oscillator(8, 3), the fast period above the slow one", () => new AwesomeOscillatorRTIndicator(8, 3), 8],
  ["Awesome Oscillator(1, 1)", () => new AwesomeOscillatorRTIndicator(1, 1), 1],
  ["Balance of Power", () => new BalanceOfPowerRTIndicator(), 1],
  ["Bull Bear Power()", () => new BullBearPowerRTIndicator(), 13],
  ["Bull Bear Power(1)", () => new BullBearPowerRTIndicator(1), 1],
  ["Relative Vigor Index()", () => new RelativeVigorIndexRTIndicator(), 13],
  ["Relative Vigor Index(5)", () => new RelativeVigorIndexRTIndicator(5), 8],
  ["Relative Vigor Index(1)", () => new RelativeVigorIndexRTIndicator(1), 4],
  ["Stochastic Oscillator()", () => new StochasticOscillatorRTIndicator(), 14],
  ["Stochastic Oscillator(3, 5, 2), a smoothing longer than the window", () => new StochasticOscillatorRTIndicator(3, 5, 2), 3],
  ["Stochastic Oscillator(1, 1, 1)", () => new StochasticOscillatorRTIndicator(1, 1, 1), 1],
  ["Ultimate Oscillator", () => new UltimateOscillatorRTIndicator(), 29],
  ["Williams %R()", () => new WilliamsRRTIndicator(), 14],
  ["Williams %R(1)", () => new WilliamsRRTIndicator(1), 1],
  ["ADL", () => new AdlRTIndicator(), 1],
  ["Chaikin Oscillator()", () => new ChaikinOscillatorRTIndicator(), 10],
  ["Chaikin Oscillator(2, 5)", () => new ChaikinOscillatorRTIndicator(2, 5), 5],
  ["Chaikin Oscillator(8, 3), the fast period above the slow one", () => new ChaikinOscillatorRTIndicator(8, 3), 8],
  ["Chaikin Oscillator(1, 1)", () => new ChaikinOscillatorRTIndicator(1, 1), 1],
  ["Ease of Movement()", () => new EaseOfMovementRTIndicator(), 15],
  ["Ease of Movement(1)", () => new EaseOfMovementRTIndicator(1), 2],
  ["Elder Force Index()", () => new ElderForceIndexRTIndicator(), 14],
  ["Elder Force Index(1)", () => new ElderForceIndexRTIndicator(1), 2],
  ["Klinger Oscillator", () => new KlingerOscillatorRTIndicator(), 56],
  ["Negative Volume Index", () => new NegativeVolumeIndexRTIndicator(), 1],
  ["PVT", () => new PvtRTIndicator(), 1],
];

const clean = klines(inputsOf("clean")).slice(0, 80);

/** The number of the bar after which the indicator is ready, feeding `series` and counting only the bars in `taken`. */
function readyAt(indicator: BarIndicator, series: readonly Kline[], taken: (bar: Kline) => boolean = () => true): number {
  let count = 0;
  for (const bar of series) {
    indicator.updateFrom(bar);
    if (taken(bar)) count++;
    if (indicator.isReady()) return count;
  }
  throw new Error("never ready");
}

describe("the bar at which the momentum and volume bar readers become ready", () => {
  it.each(cases.map(([label, make, bar]) => [label, make, bar] as const))("%s: ready after the bar it should be", (_label, make, bar) => {
    const indicator = make();
    for (let k = 1; k <= bar + 3; k++) {
      indicator.updateFrom(clean[k - 1]);
      expect(indicator.isReady(), `after bar ${k}`).toBe(k >= bar);
    }
  });

  it.each(cases.map(([label, make, bar]) => [label, make, bar] as const))(
    "%s: bars with a field it reads that is not finite, put anywhere, do not move it",
    (_label, make, bar) => {
      const everything = (index: number): Kline => ({ ...clean[index], open: NaN, high: Infinity, low: -Infinity, close: NaN, volume: Infinity });
      // before the first bar, between the bars, and after
      const dirty: Kline[] = [everything(0), everything(1)];
      const taken = new Set<Kline>();
      for (let k = 0; k < bar + 3; k++) {
        dirty.push(clean[k]);
        taken.add(clean[k]);
        if (k % 3 === 1) dirty.push(everything(k));
      }
      const indicator = make();
      let count = 0;
      let firstReady = -1;
      for (const kline of dirty) {
        indicator.updateFrom(kline);
        if (taken.has(kline)) count++;
        if (firstReady < 0 && indicator.isReady()) firstReady = count;
      }
      expect(firstReady).toBe(bar);
      expect(readyAt(make(), dirty, (kline) => taken.has(kline))).toBe(bar);
    },
  );
});
