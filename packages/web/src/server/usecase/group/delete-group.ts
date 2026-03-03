import type { GroupRepository } from "../../domain/entities/group";

export const createDeleteGroup =
  (groupRepo: GroupRepository) =>
  async (id: string): Promise<void> => {
    await groupRepo.delete(id);
  };
