import { changeStatusInputSchema } from "../domain/entities/match";
import { DynamoMatchRepository } from "../infrastructure/repositories/match-repository";

const matchRepo = new DynamoMatchRepository();

export async function changeMatchStatus(
  matchId: string,
  status: string
): Promise<void> {
  const input = changeStatusInputSchema.parse({ matchId, status });
  await matchRepo.updateStatus(input.matchId, input.status);
}
