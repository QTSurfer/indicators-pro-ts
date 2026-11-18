import { RsiRTIndicator } from "@qtsurfer/indicators";
import { describe, expect, it } from "vitest";
import { ConnorsRsiRTIndicator } from "$momentum/ConnorsRsiRTIndicator";

/** Closes rounded to cents, so ties and streak resets are common. */
function closes(): number[] {
  let seed = 11;
  const next = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  let close = 100;
  const out: number[] = [];
  for (let i = 0; i < 300; i++) {
    const noise = next() + next() + next() + next() - 2;
    close = Math.round((close + noise) * 100) / 100;
    out.push(close);
  }
  return out;
}

/** The three parts put together by hand, with the RSI smoothing chosen by `sma`. */
function reference(prices: number[], rsiPeriod: number, streakPeriod: number, rank: number, sma: boolean): number[] {
  const priceRsi = new RsiRTIndicator(rsiPeriod, sma);
  const streakRsi = new RsiRTIndicator(streakPeriod, sma);
  const rocs: number[] = [];
  const out = new Array<number>(prices.length).fill(0);
  let prev = prices[0];
  let streak = 0;
  priceRsi.update(prices[0]);
  streakRsi.update(0);
  for (let i = 1; i < prices.length; i++) {
    const c = prices[i];
    streak = c > prev ? (streak > 0 ? streak + 1 : 1) : c < prev ? (streak < 0 ? streak - 1 : -1) : 0;
    const roc = prev !== 0 ? ((c - prev) / prev) * 100 : 0;
    prev = c;
    const rsi = priceRsi.update(c);
    const streakValue = streakRsi.update(streak);
    rocs.push(roc);
    const window = rocs.slice(Math.max(0, rocs.length - rank));
    const pct = window.length > 1 ? (window.filter((v) => v < roc).length / (window.length - 1)) * 100 : 0;
    out[i] = (rsi + streakValue + pct) / 3;
  }
  return out;
}

function matches(sma: boolean, crsi: ConnorsRsiRTIndicator): void {
  const prices = closes();
  const expected = reference(prices, 3, 2, 20, sma);
  crsi.update(prices[0]);
  for (let i = 1; i < prices.length; i++) {
    expect(crsi.update(prices[i]), `tick ${i}`).toBeCloseTo(expected[i], 9);
  }
}

describe("Connors RSI smoothing of the two RSIs", () => {
  it("smooths both with Wilder's averages by default", () => {
    matches(false, new ConnorsRsiRTIndicator(3, 2, 20));
  });

  it("takes Wilder's averages with a false flag", () => {
    matches(false, new ConnorsRsiRTIndicator(3, 2, 20, false));
  });

  it("keeps Cutler's simple averages with a true flag", () => {
    matches(true, new ConnorsRsiRTIndicator(3, 2, 20, true));
  });

  it("gives different values for the two smoothings", () => {
    const prices = closes();
    expect(reference(prices, 3, 2, 20, false)).not.toEqual(reference(prices, 3, 2, 20, true));
  });
});
