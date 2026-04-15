import type { Match } from "@/server/domain/entities/match";

export type MatchState = "upcoming" | "playing" | "finished";

export function getMatchState(match: Match, now: number): MatchState {
  if (!match.scheduledTime) return "upcoming";
  const start = new Date(match.scheduledTime).getTime();
  if (isNaN(start)) return "upcoming";
  const end = start + match.durationMinutes * 60 * 1000;
  if (now >= start && now < end) return "playing";
  if (now < start) return "upcoming";
  return "finished";
}
