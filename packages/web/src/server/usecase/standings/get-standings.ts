import type { MatchRepository } from "../../domain/entities/match";
import type { TeamRepository } from "../../domain/entities/team";
import type { GroupRepository } from "../../domain/entities/group";
import { computeStandings, type StandingsRow } from "../../domain/services/standings-service";

export const createGetStandings =
  (matchRepo: MatchRepository, teamRepo: TeamRepository, groupRepo: GroupRepository, eventId: string) =>
  async (groupId?: string): Promise<Record<string, StandingsRow[]>> => {
    const [matches, teams, groups] = await Promise.all([
      matchRepo.findAll(eventId),
      teamRepo.findAll(eventId),
      groupRepo.findAll(eventId),
    ]);

    const targetGroupIds = groupId
      ? [groupId]
      : groups.map((g) => g.id).sort();

    return Object.fromEntries(
      targetGroupIds.map((gId) => [gId, computeStandings(matches, teams, gId)]),
    );
  };
