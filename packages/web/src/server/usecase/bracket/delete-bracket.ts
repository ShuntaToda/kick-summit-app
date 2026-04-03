import type { BracketRepository } from "../../domain/entities/bracket";
import type { MatchRepository } from "../../domain/entities/match";

export const createDeleteBracket =
  (bracketRepo: BracketRepository, matchRepo: MatchRepository) =>
  async (id: string, matchId: string): Promise<void> => {
    await Promise.all([
      bracketRepo.delete(id),
      matchRepo.delete(matchId),
    ]);
  };
