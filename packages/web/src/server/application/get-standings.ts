import { computeStandings, type StandingsRow } from "../domain/services/standings-service";
import { DynamoMatchRepository } from "../infrastructure/repositories/match-repository";
import { DynamoTeamRepository } from "../infrastructure/repositories/team-repository";

const matchRepo = new DynamoMatchRepository();
const teamRepo = new DynamoTeamRepository();

export async function getStandings(
  group?: string
): Promise<Record<string, StandingsRow[]>> {
  const [matches, teams] = await Promise.all([
    matchRepo.findAll(),
    teamRepo.findAll(),
  ]);

  const groups = group
    ? [group]
    : [...new Set(teams.map((t) => t.group))].sort();

  return Object.fromEntries(
    groups.map((g) => [g, computeStandings(matches, teams, g)])
  );
}
