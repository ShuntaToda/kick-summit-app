import type { Team } from "../domain/entities/team";
import { DynamoTeamRepository } from "../infrastructure/repositories/team-repository";

const teamRepo = new DynamoTeamRepository();

export async function getTeams(): Promise<Team[]> {
  return teamRepo.findAll();
}
