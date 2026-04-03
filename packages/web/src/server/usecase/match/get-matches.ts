import type { Match, MatchRepository } from "../../domain/entities/match";

export const createGetMatches =
  (matchRepo: MatchRepository, eventId: string) => (): Promise<Match[]> =>
    matchRepo.findAll(eventId);

export const createGetMatch =
  (matchRepo: MatchRepository) =>
  (matchId: string): Promise<Match | null> =>
    matchRepo.findById(matchId);
