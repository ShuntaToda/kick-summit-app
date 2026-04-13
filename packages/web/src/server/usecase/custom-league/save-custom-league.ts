import { nanoid } from "nanoid";
import type { CustomLeagueRepository } from "../../domain/entities/custom-league";

type SaveCustomLeagueInput = {
  id?: string;
  eventId: string;
  name: string;
};

export const createSaveCustomLeague =
  (repo: CustomLeagueRepository) =>
  async (input: SaveCustomLeagueInput): Promise<void> => {
    await repo.save({
      id: input.id ?? nanoid(),
      eventId: input.eventId,
      name: input.name,
    });
  };
