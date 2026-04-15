import { describe, it, expect } from "vitest";
import {
  calcBracketSize,
  calcTotalRounds,
  buildRoundLabels,
} from "./bracket-generator";

describe("calcBracketSize", () => {
  it("returns 0 for teamCount < 2", () => {
    expect(calcBracketSize(0)).toBe(0);
    expect(calcBracketSize(1)).toBe(0);
  });

  it("returns exact power of 2 for matching teamCount", () => {
    expect(calcBracketSize(2)).toBe(2);
    expect(calcBracketSize(4)).toBe(4);
    expect(calcBracketSize(8)).toBe(8);
  });

  it("rounds up to next power of 2", () => {
    expect(calcBracketSize(3)).toBe(4);
    expect(calcBracketSize(5)).toBe(8);
    expect(calcBracketSize(6)).toBe(8);
    expect(calcBracketSize(7)).toBe(8);
    expect(calcBracketSize(9)).toBe(16);
  });
});

describe("calcTotalRounds", () => {
  it("returns 0 for bracketSize < 2", () => {
    expect(calcTotalRounds(0)).toBe(0);
    expect(calcTotalRounds(1)).toBe(0);
  });

  it("returns correct round count", () => {
    expect(calcTotalRounds(2)).toBe(1);
    expect(calcTotalRounds(4)).toBe(2);
    expect(calcTotalRounds(8)).toBe(3);
    expect(calcTotalRounds(16)).toBe(4);
  });
});

describe("buildRoundLabels", () => {
  it("returns empty for 0 rounds", () => {
    expect(buildRoundLabels(0)).toEqual([]);
  });

  it("returns single label for 1 round", () => {
    expect(buildRoundLabels(1)).toEqual(["1回戦"]);
  });

  it("returns correct labels for 2 rounds", () => {
    expect(buildRoundLabels(2)).toEqual(["1回戦", "決勝"]);
  });

  it("returns correct labels for 3 rounds", () => {
    expect(buildRoundLabels(3)).toEqual(["1回戦", "準決勝", "決勝"]);
  });

  it("returns correct labels for 4 rounds", () => {
    expect(buildRoundLabels(4)).toEqual(["1回戦", "2回戦", "準決勝", "決勝"]);
  });
});
