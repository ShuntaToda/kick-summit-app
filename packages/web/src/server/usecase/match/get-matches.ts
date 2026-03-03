import type { Match, MatchRepository } from "../../domain/entities/match";

export const createGetMatches =
  (matchRepo: MatchRepository, tournamentId: string) => (): Promise<Match[]> =>
    matchRepo.findAll(tournamentId);

export const createGetMatch =
  (matchRepo: MatchRepository) =>
  (matchId: string): Promise<Match | null> =>
    matchRepo.findById(matchId);
