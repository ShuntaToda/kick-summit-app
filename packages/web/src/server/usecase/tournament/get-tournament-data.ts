import type { MatchRepository } from "../../domain/entities/match";
import type { TeamRepository } from "../../domain/entities/team";
import type { BracketRepository, TournamentBracket } from "../../domain/entities/bracket";
import type { Match } from "../../domain/entities/match";
import type { Team } from "../../domain/entities/team";

export interface TournamentData {
  brackets: TournamentBracket[];
  matches: Match[];
  teams: Team[];
}

export const createGetTournamentData =
  (bracketRepo: BracketRepository, matchRepo: MatchRepository, teamRepo: TeamRepository, tournamentId: string) =>
  async (): Promise<TournamentData> => {
    const [brackets, matches, teams] = await Promise.all([
      bracketRepo.findAll(tournamentId),
      matchRepo.findAll(tournamentId),
      teamRepo.findAll(tournamentId),
    ]);

    return {
      brackets,
      matches: matches.filter((m) => m.type === "tournament"),
      teams,
    };
  };
