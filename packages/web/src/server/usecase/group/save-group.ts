import { nanoid } from "nanoid";
import type { GroupRepository } from "../../domain/entities/group";

type SaveGroupInput = {
  id?: string;
  eventId: string;
  name: string;
};

export const createSaveGroup =
  (groupRepo: GroupRepository) =>
  async (input: SaveGroupInput): Promise<void> => {
    const id = input.id ?? nanoid();
    await groupRepo.save({ id, eventId: input.eventId, name: input.name });
  };
