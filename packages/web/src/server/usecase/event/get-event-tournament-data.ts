import type { MatchRepository } from "../../domain/entities/match";
import type { TeamRepository } from "../../domain/entities/team";
import type { BracketRepository, Bracket } from "../../domain/entities/bracket";
import type { Match } from "../../domain/entities/match";
import type { Team } from "../../domain/entities/team";

export interface EventTournamentData {
  brackets: Bracket[];
  matches: Match[];
  teams: Team[];
}

export const createGetEventTournamentData =
  (bracketRepo: BracketRepository, matchRepo: MatchRepository, teamRepo: TeamRepository, eventId: string) =>
  async (): Promise<EventTournamentData> => {
    const [brackets, matches, teams] = await Promise.all([
      bracketRepo.findAll(eventId),
      matchRepo.findAll(eventId),
      teamRepo.findAll(eventId),
    ]);

    return {
      brackets,
      matches: matches.filter((m) => m.type === "tournament"),
      teams,
    };
  };
