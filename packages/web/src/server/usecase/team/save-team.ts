import { nanoid } from "nanoid";
import type { TeamRepository } from "../../domain/entities/team";

type SaveTeamInput = {
  id?: string;
  eventId: string;
  groupId: string;
  name: string;
  color: string;
  customValues: Record<string, string | number>;
};

export const createSaveTeam =
  (teamRepo: TeamRepository) =>
  async (input: SaveTeamInput): Promise<void> => {
    const id = input.id ?? nanoid();
    await teamRepo.save({
      id,
      eventId: input.eventId,
      groupId: input.groupId,
      name: input.name,
      color: input.color,
      customValues: input.customValues,
    });
  };
