import { changeStatusInputSchema } from "../../domain/entities/match";
import type { MatchRepository } from "../../domain/entities/match";

export interface ChangeMatchStatusInput {
  matchId: string;
  status: string;
}

export const createChangeMatchStatus =
  (matchRepo: MatchRepository) =>
  async (input: ChangeMatchStatusInput): Promise<void> => {
    const validated = changeStatusInputSchema.parse(input);
    await matchRepo.updateStatus(validated.matchId, validated.status);
  };
