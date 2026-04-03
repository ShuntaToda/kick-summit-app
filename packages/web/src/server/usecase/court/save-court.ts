import { nanoid } from "nanoid";
import type { CourtRepository } from "../../domain/entities/court";

type SaveCourtInput = {
  id?: string;
  eventId: string;
  name: string;
};

export const createSaveCourt =
  (courtRepo: CourtRepository) =>
  async (input: SaveCourtInput): Promise<void> => {
    const id = input.id ?? nanoid();
    await courtRepo.save({ id, eventId: input.eventId, name: input.name });
  };
