import type { Team, TeamRepository } from "../../domain/entities/team";

export const createGetTeams =
  (teamRepo: TeamRepository, tournamentId: string) => (): Promise<Team[]> =>
    teamRepo.findAll(tournamentId);
