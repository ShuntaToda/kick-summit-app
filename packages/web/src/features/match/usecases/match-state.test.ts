import { describe, it, expect } from "vitest";
import { getMatchState } from "./match-state";
import type { Match } from "@/server/domain/entities/match";

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "m1",
    eventId: "e1",
    type: "league",
    groupId: "g1",
    teamAId: "t1",
    teamBId: "t2",
    scoreA: null,
    scoreB: null,
    halfScoreA: null,
    halfScoreB: null,
    scheduledTime: "2026-04-14T10:00:00",
    durationMinutes: 10,
    court: "A",
    status: "scheduled",
    refereeTeamId: null,
    refereeTeamId2: null,
    customLeagueId: null,
    teamARefLabel: null,
    teamBRefLabel: null,
    ...overrides,
  };
}

describe("getMatchState", () => {
  const baseTime = new Date("2026-04-14T10:00:00").getTime();

  it("returns 'upcoming' when no scheduledTime", () => {
    expect(getMatchState(makeMatch({ scheduledTime: "" }), baseTime)).toBe("upcoming");
  });

  it("returns 'upcoming' when invalid scheduledTime", () => {
    expect(getMatchState(makeMatch({ scheduledTime: "invalid" }), baseTime)).toBe("upcoming");
  });

  it("returns 'upcoming' when now is before start", () => {
    expect(getMatchState(makeMatch(), baseTime - 60_000)).toBe("upcoming");
  });

  it("returns 'playing' when now is at start", () => {
    expect(getMatchState(makeMatch(), baseTime)).toBe("playing");
  });

  it("returns 'playing' when now is during match", () => {
    expect(getMatchState(makeMatch(), baseTime + 5 * 60_000)).toBe("playing");
  });

  it("returns 'finished' when now is at end", () => {
    expect(getMatchState(makeMatch({ durationMinutes: 10 }), baseTime + 10 * 60_000)).toBe("finished");
  });

  it("returns 'finished' when now is after end", () => {
    expect(getMatchState(makeMatch(), baseTime + 15 * 60_000)).toBe("finished");
  });
});
