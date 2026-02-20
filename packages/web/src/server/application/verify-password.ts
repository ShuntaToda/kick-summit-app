import { z } from "zod";
import { DynamoTournamentRepository } from "../infrastructure/repositories/tournament-repository";
import { TOURNAMENT_ID } from "../infrastructure/dynamodb-client";

const passwordInputSchema = z.string().min(1);

const tournamentRepo = new DynamoTournamentRepository();

export async function verifyPassword(password: string): Promise<boolean> {
  const validated = passwordInputSchema.parse(password);
  const tournament = await tournamentRepo.findById(TOURNAMENT_ID);
  if (!tournament) return true; // 大会未設定時は受け入れる
  return tournament.passwordHash === validated;
}
