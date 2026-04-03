import type { EventRepository, CustomField } from "../../domain/entities/event";

type UpdateInput = {
  name: string;
  date: string;
  description: string;
  customFields: CustomField[];
};

export const createUpdateEvent =
  (eventRepo: EventRepository, eventId: string) =>
  async (input: UpdateInput): Promise<void> => {
    const event = await eventRepo.findById(eventId);
    if (!event) throw new Error("Event not found");
    await eventRepo.save({ ...event, ...input });
  };
