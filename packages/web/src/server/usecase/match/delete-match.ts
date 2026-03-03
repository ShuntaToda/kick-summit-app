import type { MatchRepository } from "../../domain/entities/match";

export const createDeleteMatch =
  (matchRepo: MatchRepository) =>
  async (id: string): Promise<void> => {
    await matchRepo.delete(id);
  };
