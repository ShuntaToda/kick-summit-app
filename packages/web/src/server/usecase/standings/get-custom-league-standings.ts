import type { MatchRepository } from "../../domain/entities/match";
import type { TeamRepository } from "../../domain/entities/team";
import type { CustomLeagueRepository } from "../../domain/entities/custom-league";
import { computeCustomLeagueStandings, type StandingsRow } from "../../domain/services/standings-service";

export const createGetCustomLeagueStandings =
  (
    matchRepo: MatchRepository,
    teamRepo: TeamRepository,
    customLeagueRepo: CustomLeagueRepository,
    eventId: string,
  ) =>
  async (): Promise<Record<string, StandingsRow[]>> => {
    const [matches, teams, customLeagues] = await Promise.all([
      matchRepo.findAll(eventId),
      teamRepo.findAll(eventId),
      customLeagueRepo.findAll(eventId),
    ]);
    return Object.fromEntries(
      customLeagues.map((cl) => [
        cl.id,
        computeCustomLeagueStandings(matches, teams, cl.id),
      ]),
    );
  };
