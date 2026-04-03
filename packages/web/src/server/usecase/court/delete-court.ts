import type { CourtRepository } from "../../domain/entities/court";

export const createDeleteCourt =
  (courtRepo: CourtRepository) =>
  async (id: string): Promise<void> => {
    await courtRepo.delete(id);
  };
