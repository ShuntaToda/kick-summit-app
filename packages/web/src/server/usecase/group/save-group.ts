import type { GroupRepository } from "../../domain/entities/group";

type SaveGroupInput = {
  id?: string;
  tournamentId: string;
  name: string;
};

export const createSaveGroup =
  (groupRepo: GroupRepository) =>
  async (input: SaveGroupInput): Promise<void> => {
    const id = input.id ?? crypto.randomUUID();
    await groupRepo.save({ id, tournamentId: input.tournamentId, name: input.name });
  };
