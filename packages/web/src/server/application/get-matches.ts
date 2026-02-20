import type { Match } from "../domain/entities/match";
import { DynamoMatchRepository } from "../infrastructure/repositories/match-repository";

const matchRepo = new DynamoMatchRepository();

export async function getMatches(): Promise<Match[]> {
  return matchRepo.findAll();
}

export async function getMatch(matchId: string): Promise<Match | null> {
  return matchRepo.findById(matchId);
}
