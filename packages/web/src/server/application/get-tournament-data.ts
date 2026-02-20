import type { Match } from "../domain/entities/match";
import type { Team } from "../domain/entities/team";
import type { TournamentBracket } from "../domain/entities/bracket";
import { DynamoBracketRepository } from "../infrastructure/repositories/bracket-repository";
import { DynamoMatchRepository } from "../infrastructure/repositories/match-repository";
import { DynamoTeamRepository } from "../infrastructure/repositories/team-repository";

const bracketRepo = new DynamoBracketRepository();
const matchRepo = new DynamoMatchRepository();
const teamRepo = new DynamoTeamRepository();

export interface TournamentData {
  brackets: TournamentBracket[];
  matches: Match[];
  teams: Team[];
}

export async function getTournamentData(): Promise<TournamentData> {
  const [brackets, matches, teams] = await Promise.all([
    bracketRepo.findAll(),
    matchRepo.findAll(),
    teamRepo.findAll(),
  ]);

  return {
    brackets,
    matches: matches.filter((m) => m.type === "tournament"),
    teams,
  };
}
