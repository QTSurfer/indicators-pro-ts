import { describe, expect, it } from "vitest";
import { reference } from "./fixtures";
import { expectSubject, subjects } from "./subjects";

// The seeded dataset never gives a flat window, a monotone ramp, a zig-zag, a series shorter than the window,
// or a zero or negative price, so the guards of the indicators for those cases are not reached by the
// scenarios of parity.test.ts. These short synthetic series reach them, and every price-fed indicator is
// compared with Java's on each, with the same tolerance as in the scenarios. A value that is not finite
// is compared as what it is: NaN, Infinity and -Infinity are three different results.

const edges = Object.entries(reference.edges);

describe("the edge inputs", () => {
  it("cover the cases the scenarios do not reach", () => {
    expect(Object.keys(reference.edges)).toEqual(
      expect.arrayContaining(["flat", "rampUp", "rampDown", "zigzag", "short", "collapse", "smallestPrice", "zeroPrice", "zeroFirstPrice", "negativePrice"]),
    );
    const flat = reference.edges.flat.price;
    expect(flat.length).toBeGreaterThanOrEqual(40);
    expect(new Set(flat).size).toBe(1);
    const up = reference.edges.rampUp.price;
    const down = reference.edges.rampDown.price;
    expect(up.every((p, i) => i === 0 || p > up[i - 1])).toBe(true);
    expect(down.every((p, i) => i === 0 || p < down[i - 1])).toBe(true);
    const zigzag = reference.edges.zigzag.price;
    const steps = zigzag.slice(1).map((p, i) => p - zigzag[i]);
    expect(steps.every((step, i) => i === 0 || step * steps[i - 1] < 0)).toBe(true);
    expect(reference.edges.short.price.length).toBeLessThan(20);
    expect(reference.edges.zeroPrice.price).toContain(0);
    expect(reference.edges.negativePrice.price.some((p) => p < 0)).toBe(true);
  });

  it("have a series for every price-fed indicator the fixture lists, and no other", () => {
    for (const [name, edge] of edges) {
      expect(Object.keys(edge.series).sort(), name).toEqual(subjects.map((subject) => subject.key).sort());
    }
  });
});

describe.each(edges)("the %s edge input", (_, edge) => {
  it.each(subjects.map((subject) => [subject.label, subject] as const))("%s equals Java's", (_label, subject) => {
    const expected = edge.series[subject.key];
    if ("throws" in expected) {
      expect(() => subject.run(edge.price), `${subject.key} throws in Java: ${expected.throws}`).toThrow();
    } else {
      expectSubject(subject, edge.price, expected, subject.key);
    }
  });
});
