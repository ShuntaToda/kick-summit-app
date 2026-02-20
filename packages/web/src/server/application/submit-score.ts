import { submitScoreInputSchema } from "../domain/entities/match";
import { DynamoMatchRepository } from "../infrastructure/repositories/match-repository";

const matchRepo = new DynamoMatchRepository();

export async function submitScore(
  matchId: string,
  scoreA: number,
  scoreB: number,
  halfScoreA: number | null,
  halfScoreB: number | null
): Promise<void> {
  const input = submitScoreInputSchema.parse({
    matchId,
    scoreA,
    scoreB,
    halfScoreA,
    halfScoreB,
  });

  await matchRepo.updateScore(
    input.matchId,
    input.scoreA,
    input.scoreB,
    input.halfScoreA,
    input.halfScoreB,
    "finished"
  );
}
