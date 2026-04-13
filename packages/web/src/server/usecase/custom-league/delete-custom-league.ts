import type { CustomLeagueRepository } from "../../domain/entities/custom-league";

export const createDeleteCustomLeague =
  (repo: CustomLeagueRepository) =>
  async (id: string): Promise<void> => {
    await repo.delete(id);
  };
