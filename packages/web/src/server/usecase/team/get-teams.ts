import type { Team, TeamRepository } from "../../domain/entities/team";

export const createGetTeams =
  (teamRepo: TeamRepository, eventId: string) => (): Promise<Team[]> =>
    teamRepo.findAll(eventId);
