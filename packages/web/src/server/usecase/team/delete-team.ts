import type { TeamRepository } from "../../domain/entities/team";

export const createDeleteTeam =
  (teamRepo: TeamRepository) =>
  async (id: string): Promise<void> => {
    await teamRepo.delete(id);
  };
