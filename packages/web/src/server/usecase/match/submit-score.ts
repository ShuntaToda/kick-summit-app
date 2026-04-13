import { submitScoreInputSchema } from "../../domain/entities/match";
import type { MatchRepository } from "../../domain/entities/match";

export interface SubmitScoreInput {
  matchId: string;
  scoreA: number;
  scoreB: number;
  halfScoreA: number | null;
  halfScoreB: number | null;
}

export const createSubmitScore =
  (matchRepo: MatchRepository) =>
  async (input: SubmitScoreInput): Promise<void> => {
    const validated = submitScoreInputSchema.parse(input);

    // 既存のステータスを維持するため、まず現在の試合を取得
    const existing = await matchRepo.findById(validated.matchId);
    const status = existing?.status ?? "scheduled";

    await matchRepo.updateScore(
      validated.matchId,
      validated.scoreA,
      validated.scoreB,
      validated.halfScoreA,
      validated.halfScoreB,
      status,
    );
  };
